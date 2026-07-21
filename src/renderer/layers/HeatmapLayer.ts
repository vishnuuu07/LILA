import { Camera } from "../Camera";
import type { HeatmapGrid } from "../MapRenderer";
import { MAP_SIZE } from "../utils/math";

/** Colorizes precomputed intensity grids; it never derives heatmap data from player paths. */
export class HeatmapLayer {
  private readonly canvases = new WeakMap<HeatmapGrid, HTMLCanvasElement>();

  public draw(context: CanvasRenderingContext2D, camera: Camera, grid: HeatmapGrid | undefined, opacity: number): void {
    if (grid === undefined || opacity <= 0) return;
    const image = this.canvasFor(grid);
    context.save();
    camera.apply(context);
    context.globalAlpha = Math.min(Math.max(opacity, 0), 1);
    context.imageSmoothingEnabled = true;
    context.drawImage(image, 0, 0, MAP_SIZE, MAP_SIZE);
    context.restore();
  }

  private canvasFor(grid: HeatmapGrid): HTMLCanvasElement {
    const cached = this.canvases.get(grid);
    if (cached !== undefined) return cached;
    const canvas = document.createElement("canvas");
    canvas.width = grid.columns;
    canvas.height = grid.rows;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Canvas 2D context unavailable");
    const pixels = context.createImageData(grid.columns, grid.rows);
    for (let index = 0; index < grid.values.length && index * 4 < pixels.data.length; index += 1) {
      const intensity = Math.min(Math.max(grid.values[index], 0), 1);
      const offset = index * 4;
      pixels.data[offset] = Math.round(246 * intensity);
      pixels.data[offset + 1] = Math.round(77 + 122 * (1 - intensity));
      pixels.data[offset + 2] = Math.round(60 * (1 - intensity));
      pixels.data[offset + 3] = Math.round(220 * intensity);
    }
    context.putImageData(pixels, 0, 0);
    this.canvases.set(grid, canvas);
    return canvas;
  }
}
