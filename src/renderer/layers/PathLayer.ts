import { Camera } from "../Camera";
import type { RendererPlayer } from "../MapRenderer";
import { isFinitePoint } from "../utils/math";
import { pointToSegmentDistanceSquared } from "../utils/math";

/** Stable analyst-only route colors. They deliberately do not overlap semantic event colors. */
export const COMPARISON_COLORS = ["#78d7ff", "#f09cff", "#8ff0bd", "#ffd166", "#a9b8ff", "#ff9b79", "#b9ef64", "#c7a8ff"] as const;
export function comparisonColor(index: number): string { return COMPARISON_COLORS[index % COMPARISON_COLORS.length]; }

/** Renders only the already-completed portion of each preprocessed player journey. */
export class PathLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, players: readonly RendererPlayer[], playbackTime: number, selectedPlayerId: string | null, comparisonPlayerIds: readonly string[] = []): void {
    context.save();
    camera.apply(context);
    context.lineJoin = "round";
    context.lineCap = "round";
    for (const player of players) {
      const selected = player.id === selectedPlayerId;
      const comparisonIndex = comparisonPlayerIds.indexOf(player.id);
      const compared = comparisonIndex >= 0;
      context.strokeStyle = compared ? comparisonColor(comparisonIndex) : selected ? "#39b8ff" : player.isBot ? "#f6b24d" : "#31d7e8";
      context.globalAlpha = compared || selected ? 1 : 0.72;
      context.lineWidth = (compared || selected ? 3.1 : 1.2) / camera.scale;
      context.setLineDash(compared && comparisonIndex % 2 === 1 ? [7 / camera.scale, 4 / camera.scale] : []);
      let started = false;
      let lastX = Number.NaN;
      let lastY = Number.NaN;
      for (const point of player.journey) {
        if (point.t > playbackTime) break;
        if (!isFinitePoint(point.x, point.y)) {
          if (started) context.stroke();
          started = false;
          continue;
        }
        if (!started) { context.beginPath(); context.moveTo(point.x, point.y); started = true; }
        else context.lineTo(point.x, point.y);
        lastX = point.x;
        lastY = point.y;
      }
      if (started) context.stroke();
      if (Number.isFinite(lastX) && Number.isFinite(lastY)) {
        context.fillStyle = compared ? comparisonColor(comparisonIndex) : selected ? "#e6f7ff" : player.isBot ? "#f6b24d" : "#31d7e8";
        context.globalAlpha = 1;
        context.beginPath(); context.arc(lastX, lastY, (compared || selected ? 4 : 2.5) / camera.scale, 0, Math.PI * 2); context.fill();
      }
    }
    context.setLineDash([]);
    context.restore();
  }

  /** Finds the nearest completed path segment under a CSS-pixel pointer. */
  public hitTest(camera: Camera, players: readonly RendererPlayer[], playbackTime: number, screenX: number, screenY: number): RendererPlayer | null {
    const threshold = 9 * 9;
    let closest = threshold;
    let result: RendererPlayer | null = null;
    for (const player of players) {
      let previous: { x: number; y: number } | null = null;
      for (const point of player.journey) {
        if (point.t > playbackTime) break;
        if (!isFinitePoint(point.x, point.y)) { previous = null; continue; }
        const current = camera.mapToScreen(point.x, point.y);
        if (previous !== null) {
          const distance = pointToSegmentDistanceSquared(screenX, screenY, previous.x, previous.y, current.x, current.y);
          if (distance <= closest) { closest = distance; result = player; }
        }
        previous = current;
      }
    }
    return result;
  }
}
