import { Camera } from "../Camera";
import type { AnalyticsOverlay } from "../MapRenderer";

/** Draws independent, tinted aggregate grids without replacing match heatmaps. */
export class AnalyticsLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, overlays: readonly AnalyticsOverlay[]): void {
    context.save(); camera.apply(context);
    for (const overlay of overlays) {
      const maximum = Math.max(...overlay.values, 0); if (maximum === 0 || overlay.opacity <= 0) continue;
      const cell = 1024 / overlay.columns;
      context.fillStyle = overlay.color;
      overlay.values.forEach((value, index) => { if (value <= 0) return; context.globalAlpha = Math.max(.06, value / maximum) * overlay.opacity; context.fillRect((index % overlay.columns) * cell, Math.floor(index / overlay.columns) * cell, cell, cell); });
    }
    context.restore();
  }
}
