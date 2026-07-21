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
      const [red, green, blue] = heatColor(intensity);
      pixels.data[offset] = red;
      pixels.data[offset + 1] = green;
      pixels.data[offset + 2] = blue;
      // A visible floor keeps low-density movement readable over every minimap.
      pixels.data[offset + 3] = intensity === 0 ? 0 : Math.round(108 + 142 * intensity);
    }
    context.putImageData(pixels, 0, 0);
    this.canvases.set(grid, canvas);
    return canvas;
  }
}

function heatColor(value: number): readonly [number, number, number] {
  const stops: readonly (readonly [number, number, number, number])[] = [
    [0, 87, 255, 114], [0.25, 159, 255, 53], [0.5, 255, 225, 46], [0.75, 255, 139, 45], [1, 255, 67, 67],
  ];
  const upper = stops.find((stop) => value <= stop[0]) ?? stops[stops.length - 1];
  const lower = [...stops].reverse().find((stop) => value >= stop[0]) ?? stops[0];
  const span = upper[0] - lower[0] || 1;
  const mix = (value - lower[0]) / span;
  return [1, 2, 3].map((index) => Math.round(lower[index] + (upper[index] - lower[index]) * mix)) as [number, number, number];
}
