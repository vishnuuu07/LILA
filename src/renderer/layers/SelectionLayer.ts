import { Camera } from "../Camera";
import type { InsightGrid, RendererEvent, SelectionArea } from "../MapRenderer";

/** Draws non-data overlays: an inspected area and a highlighted event marker. */
export class SelectionLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, area: SelectionArea | null, hoveredEvent: RendererEvent | null, insightGrid: InsightGrid | null): void {
    if (area === null && hoveredEvent === null && insightGrid === null) return;
    context.save();
    camera.apply(context);
    if (area !== null) {
      context.fillStyle = "rgba(57, 184, 255, 0.16)";
      context.strokeStyle = "#39b8ff";
      context.lineWidth = 1.5 / camera.scale;
      context.beginPath(); context.arc(area.x, area.y, area.radius, 0, Math.PI * 2); context.fill(); context.stroke();
    }
    if (insightGrid !== null) {
      const cell = 1024 / insightGrid.divisions;
      const x = insightGrid.column * cell;
      const y = insightGrid.row * cell;
      context.fillStyle = "rgba(120, 255, 208, 0.14)";
      context.strokeStyle = "#83f5cd";
      context.lineWidth = 2 / camera.scale;
      context.setLineDash([8 / camera.scale, 5 / camera.scale]);
      context.fillRect(x, y, cell, cell);
      context.strokeRect(x, y, cell, cell);
      context.setLineDash([]);
    }
    if (hoveredEvent !== null) {
      context.strokeStyle = "#e6edf7";
      context.lineWidth = 2 / camera.scale;
      context.beginPath(); context.arc(hoveredEvent.x, hoveredEvent.y, 13 / camera.scale, 0, Math.PI * 2); context.stroke();
    }
    context.restore();
  }
}
