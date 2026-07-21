import { clamp, MAP_SIZE } from "./utils/math";

export interface MapPoint {
  x: number;
  y: number;
}

/** Maps preprocessed 1024-space minimap coordinates to the current canvas viewport. */
export class Camera {
  private viewportWidth = 1;
  private viewportHeight = 1;
  private zoom = 1;
  private panX = 0;
  private panY = 0;

  public constructor(private readonly mapSize = MAP_SIZE, private readonly minZoom = 1, private readonly maxZoom = 8) {}

  /** Updates the CSS-pixel viewport while preserving its current centre map position. */
  public resize(width: number, height: number): void {
    const center = this.screenToMap(this.viewportWidth / 2, this.viewportHeight / 2);
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
    this.panX = this.viewportWidth / 2 - center.x * this.scale;
    this.panY = this.viewportHeight / 2 - center.y * this.scale;
    this.clampPan();
  }

  /** Sets an absolute zoom, preserving the supplied screen anchor. */
  public setZoom(zoom: number, anchorX = this.viewportWidth / 2, anchorY = this.viewportHeight / 2): void {
    const mapAnchor = this.screenToMap(anchorX, anchorY);
    this.zoom = clamp(zoom, this.minZoom, this.maxZoom);
    this.panX = anchorX - mapAnchor.x * this.scale;
    this.panY = anchorY - mapAnchor.y * this.scale;
    this.clampPan();
  }

  /** Pans by CSS pixels and prevents exposing empty space beyond the map edge. */
  public panBy(deltaX: number, deltaY: number): void {
    this.panX += deltaX;
    this.panY += deltaY;
    this.clampPan();
  }

  /** Applies the map-to-screen transform to a rendering context. */
  public apply(context: CanvasRenderingContext2D): void {
    context.translate(this.panX, this.panY);
    context.scale(this.scale, this.scale);
  }

  /** Converts a preprocessed minimap point into CSS-pixel screen coordinates. */
  public mapToScreen(x: number, y: number): MapPoint {
    return { x: this.panX + x * this.scale, y: this.panY + y * this.scale };
  }

  /** Converts CSS-pixel screen coordinates back into 1024-space minimap coordinates. */
  public screenToMap(x: number, y: number): MapPoint {
    return { x: (x - this.panX) / this.scale, y: (y - this.panY) / this.scale };
  }

  public get currentZoom(): number { return this.zoom; }
  public get scale(): number { return Math.min(this.viewportWidth, this.viewportHeight) / this.mapSize * this.zoom; }
  public get mapSizeInPixels(): number { return this.mapSize * this.scale; }

  private clampPan(): void {
    const renderedSize = this.mapSizeInPixels;
    this.panX = renderedSize <= this.viewportWidth
      ? (this.viewportWidth - renderedSize) / 2
      : clamp(this.panX, this.viewportWidth - renderedSize, 0);
    this.panY = renderedSize <= this.viewportHeight
      ? (this.viewportHeight - renderedSize) / 2
      : clamp(this.panY, this.viewportHeight - renderedSize, 0);
  }
}
