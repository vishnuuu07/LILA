import { Camera } from "../Camera";
import type { RendererPlayer } from "../MapRenderer";
import { isFinitePoint } from "../utils/math";

/** Renders only the already-completed portion of each preprocessed player journey. */
export class PathLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, players: readonly RendererPlayer[], playbackTime: number, selectedPlayerId: string | null): void {
    context.save();
    camera.apply(context);
    context.lineJoin = "round";
    context.lineCap = "round";
    for (const player of players) {
      const selected = player.id === selectedPlayerId;
      context.strokeStyle = selected ? "#39b8ff" : player.isBot ? "#f6b24d" : "#31d7e8";
      context.globalAlpha = selected ? 1 : 0.72;
      context.lineWidth = (selected ? 3.25 : 1.2) / camera.scale;
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
        context.fillStyle = selected ? "#e6f7ff" : player.isBot ? "#f6b24d" : "#31d7e8";
        context.globalAlpha = 1;
        context.beginPath(); context.arc(lastX, lastY, (selected ? 4 : 2.5) / camera.scale, 0, Math.PI * 2); context.fill();
      }
    }
    context.restore();
  }
}
