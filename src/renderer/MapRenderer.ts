import { Camera } from "./Camera";
import { beginFrame, resizeCanvas } from "./utils/canvas";
import { clamp } from "./utils/math";
import { EventLayer } from "./layers/EventLayer";
import { HeatmapLayer } from "./layers/HeatmapLayer";
import { MinimapLayer } from "./layers/MinimapLayer";
import { PathLayer } from "./layers/PathLayer";
import { SelectionLayer } from "./layers/SelectionLayer";

export interface JourneyPoint { t: number; x: number; y: number; }
export interface RendererPlayer { id: string; isBot: boolean; journey: readonly JourneyPoint[]; }
export interface RendererEvent { id: string; type: string; playerId: string; t: number; x: number; y: number; }
export interface HeatmapGrid { columns: number; rows: number; values: readonly number[]; }
export interface SelectionArea { x: number; y: number; radius: number; }
export type LayerName = "minimap" | "heatmap" | "paths" | "events" | "selections";
export type HeatmapType = "traffic" | "kills" | "deaths";

/** Renderer-ready match contract. Coordinates must already be validated 1024-space pixels. */
export interface RenderMatch {
  mapId: string;
  duration: number;
  players: readonly RendererPlayer[];
  events: readonly RendererEvent[];
  heatmaps?: Partial<Record<HeatmapType, HeatmapGrid>>;
}

export interface MapRendererOptions {
  mapImages: Readonly<Record<string, string>>;
  onHoverEvent?: (event: RendererEvent | null) => void;
}

const INITIAL_LAYERS: Record<LayerName, boolean> = { minimap: true, heatmap: false, paths: true, events: true, selections: true };

/**
 * Canvas-only orchestration API. React owns UI and state; it passes immutable, already-preprocessed data here.
 * This class never fetches/parses telemetry, derives statistics, or converts world coordinates.
 */
export class MapRenderer {
  private readonly context: CanvasRenderingContext2D;
  private readonly camera = new Camera();
  private readonly minimapLayer = new MinimapLayer();
  private readonly heatmapLayer = new HeatmapLayer();
  private readonly pathLayer = new PathLayer();
  private readonly eventLayer = new EventLayer();
  private readonly selectionLayer = new SelectionLayer();
  private readonly layers = { ...INITIAL_LAYERS };
  private match: RenderMatch | null = null;
  private playbackTime = 0;
  private heatmapType: HeatmapType = "traffic";
  private heatmapOpacity = 0.65;
  private selectedPlayerId: string | null = null;
  private comparisonPlayerIds: readonly string[] = [];
  private selectedArea: SelectionArea | null = null;
  private selectedEvent: RendererEvent | null = null;
  private hoveredEvent: RendererEvent | null = null;
  private frameId: number | null = null;
  private dragging = false;
  private pointerX = 0;
  private pointerY = 0;

  public constructor(private readonly canvas: HTMLCanvasElement, private readonly options: MapRendererOptions) {
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("ATLAS requires a CanvasRenderingContext2D");
    this.context = context;
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.resize();
  }

  /** Loads renderer-ready data and starts the map-image request. No JSON parsing occurs in this method. */
  public loadMatch(match: RenderMatch): void {
    this.match = match;
    this.playbackTime = 0;
    this.hoveredEvent = null;
    this.selectedEvent = null;
    this.selectedPlayerId = null;
    const imageSource = this.options.mapImages[match.mapId];
    this.minimapLayer.load(match.mapId, imageSource ?? "", () => this.requestRender());
    this.requestRender();
  }

  /** Limits playback to the selected match duration and redraws only once per animation frame. */
  public setPlaybackTime(timestamp: number): void {
    this.playbackTime = clamp(timestamp, 0, this.match?.duration ?? 0);
    this.requestRender();
  }

  /** Sets camera zoom around the supplied CSS-pixel cursor, or the viewport centre by default. */
  public setZoom(zoom: number, anchorX?: number, anchorY?: number): void {
    this.camera.setZoom(zoom, anchorX, anchorY);
    this.requestRender();
  }

  /** Pans the camera in CSS pixels, clamped to minimap bounds. */
  public pan(deltaX: number, deltaY: number): void {
    this.camera.panBy(deltaX, deltaY);
    this.requestRender();
  }

  /** Restores the initial centered full-map camera view. */
  public resetView(): void {
    this.camera.reset();
    this.requestRender();
  }

  /** Returns the currently visible event under a CSS-pixel point. */
  public hitTestEvent(screenX: number, screenY: number): RendererEvent | null {
    return this.match !== null && this.layers.events
      ? this.eventLayer.hitTest(this.camera, this.match.events, this.playbackTime, screenX, screenY)
      : null;
  }

  /** Returns the completed player path under a CSS-pixel point. */
  public hitTestPlayer(screenX: number, screenY: number): RendererPlayer | null {
    return this.match !== null && this.layers.paths
      ? this.pathLayer.hitTest(this.camera, this.match.players, this.playbackTime, screenX, screenY)
      : null;
  }

  /** Converts a CSS-pixel point within the canvas into the validated 1024-space map coordinate system. */
  public screenToMap(x: number, y: number): { x: number; y: number } {
    return this.camera.screenToMap(x, y);
  }

  /** Enables or disables a render layer without changing the underlying match data. */
  public toggleLayer(layer: LayerName, visible?: boolean): void {
    this.layers[layer] = visible ?? !this.layers[layer];
    this.requestRender();
  }

  /** Chooses which precomputed heatmap grid is displayed. */
  public setHeatmap(type: HeatmapType, opacity = this.heatmapOpacity): void {
    this.heatmapType = type;
    this.heatmapOpacity = clamp(opacity, 0, 1);
    this.requestRender();
  }

  /** Replaces one derived heatmap grid without resetting playback, camera, or selections. */
  public setHeatmapGrid(type: HeatmapType, grid: HeatmapGrid | undefined): void {
    if (this.match === null) return;
    this.match = { ...this.match, heatmaps: { ...this.match.heatmaps, [type]: grid } };
    this.requestRender();
  }

  /** Highlights a player path without modifying the supplied match data. */
  public setSelectedPlayer(playerId: string | null): void {
    this.selectedPlayerId = playerId;
    this.requestRender();
  }

  /** Accentuates up to two analyst-selected journeys while preserving normal path rendering. */
  public setComparisonPlayers(playerIds: readonly string[]): void {
    this.comparisonPlayerIds = playerIds.slice(0, 2);
    this.requestRender();
  }

  /** Displays an inspection radius supplied by React's area-inspector state. */
  public setSelectedArea(area: SelectionArea | null): void {
    this.selectedArea = area;
    this.requestRender();
  }

  /** Highlights a selected event independently of transient pointer hover. */
  public setSelectedEvent(event: RendererEvent | null): void {
    this.selectedEvent = event;
    this.requestRender();
  }

  /** Resizes for the canvas element's CSS box while preserving camera zoom and centre map position. */
  public resize(width = this.canvas.clientWidth, height = this.canvas.clientHeight): void {
    const viewport = resizeCanvas(this.canvas, width, height);
    this.camera.resize(viewport.width, viewport.height);
    this.requestRender();
  }

  /** Releases DOM listeners and scheduled work. The instance must not be reused after destruction. */
  public destroy(): void {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
  }

  private requestRender(): void {
    if (this.frameId !== null) return;
    this.frameId = requestAnimationFrame(() => { this.frameId = null; this.render(); });
  }

  private render(): void {
    beginFrame(this.context, this.canvas);
    if (this.match === null) return;
    if (this.layers.minimap) this.minimapLayer.draw(this.context, this.camera);
    if (this.layers.heatmap) this.heatmapLayer.draw(this.context, this.camera, this.match.heatmaps?.[this.heatmapType], this.heatmapOpacity);
    if (this.layers.paths) this.pathLayer.draw(this.context, this.camera, this.match.players, this.playbackTime, this.selectedPlayerId, this.comparisonPlayerIds);
    if (this.layers.events) this.eventLayer.draw(this.context, this.camera, this.match.events, this.playbackTime, this.hoveredEvent?.id ?? null);
    if (this.layers.selections) this.selectionLayer.draw(this.context, this.camera, this.selectedArea, this.selectedEvent ?? this.hoveredEvent);
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    this.pointerX = event.clientX;
    this.pointerY = event.clientY;
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    if (this.dragging) {
      this.pan(event.clientX - this.pointerX, event.clientY - this.pointerY);
      this.pointerX = event.clientX;
      this.pointerY = event.clientY;
      return;
    }
    const next = this.match !== null && this.layers.events
      ? this.eventLayer.hitTest(this.camera, this.match.events, this.playbackTime, screenX, screenY)
      : null;
    if (next?.id !== this.hoveredEvent?.id) {
      this.hoveredEvent = next;
      this.options.onHoverEvent?.(next);
      this.requestRender();
    }
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    this.dragging = false;
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
  };

  private readonly onPointerLeave = (): void => {
    if (!this.dragging && this.hoveredEvent !== null) {
      this.hoveredEvent = null;
      this.options.onHoverEvent?.(null);
      this.requestRender();
    }
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const multiplier = Math.exp(-event.deltaY * 0.0015);
    this.setZoom(this.camera.currentZoom * multiplier, event.clientX - rect.left, event.clientY - rect.top);
  };
}
