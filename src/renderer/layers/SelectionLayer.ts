import { Camera } from "../Camera";
import type { RendererEvent, SelectionArea } from "../MapRenderer";

/** Draws non-data overlays: an inspected area and a highlighted event marker. */
export class SelectionLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, area: SelectionArea | null, hoveredEvent: RendererEvent | null): void {
    if (area === null && hoveredEvent === null) return;
    context.save();
    camera.apply(context);
    if (area !== null) {
      context.fillStyle = "rgba(57, 184, 255, 0.16)";
      context.strokeStyle = "#39b8ff";
      context.lineWidth = 1.5 / camera.scale;
      context.beginPath(); context.arc(area.x, area.y, area.radius, 0, Math.PI * 2); context.fill(); context.stroke();
    }
    if (hoveredEvent !== null) {
      context.strokeStyle = "#e6edf7";
      context.lineWidth = 2 / camera.scale;
      context.beginPath(); context.arc(hoveredEvent.x, hoveredEvent.y, 13 / camera.scale, 0, Math.PI * 2); context.stroke();
    }
    context.restore();
  }
}
