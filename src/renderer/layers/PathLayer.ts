import { Camera } from "../Camera";
import type { RendererPlayer } from "../MapRenderer";
import { isFinitePoint } from "../utils/math";
import { pointToSegmentDistanceSquared } from "../utils/math";

/** Renders only the already-completed portion of each preprocessed player journey. */
export class PathLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, players: readonly RendererPlayer[], playbackTime: number, selectedPlayerId: string | null, comparisonPlayerIds: readonly string[] = []): void {
    context.save();
    camera.apply(context);
    context.lineJoin = "round";
    context.lineCap = "round";
    for (const player of players) {
      const selected = player.id === selectedPlayerId;
      const companion = !selected && player.id === comparisonPlayerIds[1];
      context.strokeStyle = selected ? "#39b8ff" : companion ? "#d58cff" : player.isBot ? "#f6b24d" : "#31d7e8";
      context.globalAlpha = selected || companion ? 1 : 0.72;
      context.lineWidth = (selected ? 3.25 : companion ? 2.5 : 1.2) / camera.scale;
      context.setLineDash(companion ? [7 / camera.scale, 4 / camera.scale] : []);
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
        context.fillStyle = selected ? "#e6f7ff" : companion ? "#f0dfff" : player.isBot ? "#f6b24d" : "#31d7e8";
        context.globalAlpha = 1;
        context.beginPath(); context.arc(lastX, lastY, (selected ? 4 : 2.5) / camera.scale, 0, Math.PI * 2); context.fill();
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
