import { Camera } from "../Camera";
import { MAP_SIZE } from "../utils/math";

/** Caches and draws a minimap image without allowing image dimensions to distort data coordinates. */
export class MinimapLayer {
  private image: HTMLImageElement | null = null;
  private imageKey = "";
  private failed = false;

  /** Begins loading a map image. A new request replaces the previous cached image. */
  public load(mapKey: string, source: string, onReady: () => void): void {
    if (mapKey === this.imageKey) return;
    this.imageKey = mapKey;
    this.image = null;
    this.failed = false;
    if (source.length === 0) {
      this.failed = true;
      onReady();
      return;
    }
    const image = new Image();
    image.decoding = "async";
    image.onload = () => { if (this.imageKey === mapKey) { this.image = image; onReady(); } };
    image.onerror = () => { if (this.imageKey === mapKey) { this.failed = true; onReady(); } };
    image.src = source;
  }

  /** Draws the loaded image or a deliberately quiet placeholder for a missing minimap. */
  public draw(context: CanvasRenderingContext2D, camera: Camera): void {
    context.save();
    camera.apply(context);
    if (this.image !== null) {
      context.drawImage(this.image, 0, 0, MAP_SIZE, MAP_SIZE);
    } else {
      context.fillStyle = "#182033";
      context.fillRect(0, 0, MAP_SIZE, MAP_SIZE);
      context.strokeStyle = "#35425c";
      context.lineWidth = 2 / camera.scale;
      context.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
      context.fillStyle = "#9ba9bf";
      context.font = `${18 / camera.scale}px Inter, sans-serif`;
      context.textAlign = "center";
      context.fillText(this.failed ? "Minimap unavailable" : "Loading minimap", MAP_SIZE / 2, MAP_SIZE / 2);
    }
    context.restore();
  }
}
