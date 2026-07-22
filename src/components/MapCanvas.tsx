import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { Crosshair, LoaderCircle, MapPinned, MousePointer2 } from "lucide-react";
import { MapRenderer, type AnalyticsOverlay, type HeatmapGrid, type InsightGrid, type RendererEvent, type SelectionArea } from "../renderer/MapRenderer";
import type { HeatmapKind, ParsedAtlasMatch } from "../types/atlas";
import { comparisonColor } from "../renderer/layers/PathLayer";
import { playerEventCounts } from "../utils/matchAnalytics";

const mapImages: Readonly<Record<string, string>> = {
  AmbroseValley: new URL("../../player_data/minimaps/AmbroseValley_Minimap.png", import.meta.url).href,
  GrandRift: new URL("../../player_data/minimaps/GrandRift_Minimap.png", import.meta.url).href,
  Lockdown: new URL("../../player_data/minimaps/Lockdown_Minimap.jpg", import.meta.url).href,
};

interface MapCanvasProps {
  match: ParsedAtlasMatch | null;
  state: "loading" | "ready" | "error";
  error: string | null;
  playbackTime: number;
  selectedPlayerId: string | null;
  comparisonPlayerIds: readonly string[];
  selectedEvent: RendererEvent | null;
  area: SelectionArea | null;
  insightGrid: InsightGrid | null;
  heatmap: HeatmapKind;
  heatmapGrid?: HeatmapGrid;
  heatmapOpacity: number;
  layers: { paths: boolean; events: boolean; loot: boolean; storm: boolean };
  analyticsOverlays?: readonly AnalyticsOverlay[];
  onHoverEvent: (event: RendererEvent | null) => void;
  onSelectEvent: (event: RendererEvent | null) => void;
  onSelectPlayer: (playerId: string | null) => void;
  onArea: (area: SelectionArea | null) => void;
}

export function MapCanvas(props: MapCanvasProps) {
  const stageRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const [hovered, setHovered] = useState<RendererEvent | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const visibleEvents = useMemo(() => props.match?.events.filter((event) => (
    (props.layers.loot || event.type !== "Loot") && (props.layers.storm || event.type !== "KilledByStorm")
  )) ?? [], [props.match, props.layers.loot, props.layers.storm]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (canvas === null || stage === null) return;
    const renderer = new MapRenderer(canvas, { mapImages, onHoverEvent: (event) => { setHovered(event); props.onHoverEvent(event); }, onAreaMove: props.onArea });
    rendererRef.current = renderer;
    // The stage owns layout. Observing the canvas itself can preserve an interim inline size
    // and leave a large unused workspace beside the map on wide displays.
    const resize = () => renderer.resize(stage.clientWidth, stage.clientHeight);
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    return () => { observer.disconnect(); renderer.destroy(); rendererRef.current = null; };
  }, [props.onHoverEvent]);

  useEffect(() => {
    if (props.match === null) return;
    rendererRef.current?.loadMatch({ ...props.match, events: visibleEvents });
  }, [props.match]);
  useEffect(() => { rendererRef.current?.setEvents(visibleEvents); }, [visibleEvents]);
  useEffect(() => { rendererRef.current?.setPlaybackTime(props.playbackTime); }, [props.playbackTime]);
  useEffect(() => { rendererRef.current?.setSelectedPlayer(props.selectedPlayerId); }, [props.selectedPlayerId]);
  useEffect(() => { rendererRef.current?.setSelectedEvent(props.selectedEvent); }, [props.selectedEvent]);
  useEffect(() => { rendererRef.current?.setSelectedArea(props.area); }, [props.area]);
  useEffect(() => { rendererRef.current?.setInsightGrid(props.insightGrid); }, [props.insightGrid]);
  useEffect(() => { rendererRef.current?.setAnalyticsOverlays(props.analyticsOverlays ?? []); }, [props.analyticsOverlays]);
  useEffect(() => { rendererRef.current?.setComparisonPlayers(props.comparisonPlayerIds); }, [props.comparisonPlayerIds]);
  useEffect(() => {
    if (props.heatmap !== "none") rendererRef.current?.setHeatmapGrid(props.heatmap, props.heatmapGrid);
  }, [props.heatmap, props.heatmapGrid]);
  useEffect(() => { rendererRef.current?.toggleLayer("paths", props.layers.paths); rendererRef.current?.toggleLayer("events", props.layers.events); }, [props.layers.paths, props.layers.events]);
  useEffect(() => { rendererRef.current?.toggleLayer("heatmap", props.heatmap !== "none"); if (props.heatmap !== "none") rendererRef.current?.setHeatmap(props.heatmap, props.heatmapOpacity); }, [props.heatmap, props.heatmapOpacity]);

  const selectMapTarget = (event: MouseEvent<HTMLCanvasElement>) => {
    if (suppressClick.current) { suppressClick.current = false; return; }
    const renderer = rendererRef.current;
    if (renderer === null || props.match === null) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;
    const selectedEvent = renderer.hitTestEvent(screenX, screenY);
    if (selectedEvent !== null) {
      props.onSelectEvent(selectedEvent);
      props.onSelectPlayer(null);
      return;
    }
    const selectedPlayer = renderer.hitTestPlayer(screenX, screenY);
    if (selectedPlayer !== null) {
      props.onSelectPlayer(selectedPlayer.id);
      props.onSelectEvent(null);
      return;
    }
    props.onSelectEvent(null);
    const point = renderer.screenToMap(screenX, screenY);
    if (point.x >= 0 && point.x <= 1024 && point.y >= 0 && point.y <= 1024) props.onArea({ ...point, radius: 75 });
  };

  const onPointerDown = (event: PointerEvent<HTMLCanvasElement>): void => { pointerStart.current = { x: event.clientX, y: event.clientY }; suppressClick.current = false; };
  const onPointerMove = (event: PointerEvent<HTMLCanvasElement>): void => {
    const start = pointerStart.current;
    if (start && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) suppressClick.current = true;
  };
  const onPointerEnd = (): void => { pointerStart.current = null; };
  const comparedPlayers = props.comparisonPlayerIds.map((id) => props.match?.players.find((player) => player.id === id)).filter((player): player is NonNullable<typeof player> => Boolean(player));

  const resetView = (): void => rendererRef.current?.resetView();

  return <section ref={stageRef} className="map-stage" aria-label="Interactive match map"><canvas ref={canvasRef} tabIndex={0} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onClick={selectMapTarget} onDoubleClick={resetView} aria-label="Match map. Drag to pan, drag the blue inspection lens to move it, scroll to zoom, click a path or marker to inspect it, or click open space to inspect an area. Double click resets the map." />
    <div className="map-chrome"><span><MapPinned size={15} /> {props.match?.mapId ?? "Awaiting data"}</span><span><MousePointer2 size={14} /> Drag to pan · Scroll to zoom</span></div>
    {hovered && <div className="event-tooltip" role="tooltip"><Crosshair size={14} /><strong>{hovered.type}</strong><span>t {formatTime(hovered.t)}</span></div>}
    {comparedPlayers.length > 0 && props.match && <aside className="comparison-dock" aria-label="Compared player statistics"><header><strong>Journey comparison</strong><span>{comparedPlayers.length} selected</span></header><div>{comparedPlayers.map((player, index) => { const events = playerEventCounts(player, props.match!); return <article key={player.id} style={{ "--route": comparisonColor(index) } as CSSProperties}><i /><strong>{player.displayName ?? shortId(player.id)}</strong><span>{formatTime(player.survivalTime ?? 0)} · {Math.round(player.pathLength ?? 0)} px</span><small>{events.eliminations} credited · {events.loot} loot · {events.outcome}</small></article>; })}</div></aside>}
    {props.state === "loading" && <Overlay icon={<LoaderCircle className="spin" />} title="Loading match" detail="Preparing preprocessed journeys and events…" />}
    {props.state === "error" && <Overlay icon={<MapPinned />} title="No match on canvas" detail={props.error ?? "Choose a match from the filter rail."} />}
    {props.state === "ready" && props.match === null && <Overlay icon={<MapPinned />} title="Choose a match" detail="Use the map, date, and match filters to begin." />}
  </section>;
}

function Overlay({ icon, title, detail }: { icon: ReactNode; title: string; detail: string }) { return <div className="canvas-overlay"><div>{icon}</div><h2>{title}</h2><p>{detail}</p></div>; }
function formatTime(seconds: number): string { const rounded = Math.max(0, Math.floor(seconds)); return `${Math.floor(rounded / 60).toString().padStart(2, "0")}:${(rounded % 60).toString().padStart(2, "0")}`; }
function shortId(value: string): string { return value.length > 16 ? `${value.slice(0, 8)}…${value.slice(-4)}` : value; }
