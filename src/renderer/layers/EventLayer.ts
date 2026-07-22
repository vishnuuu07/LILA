import { Camera } from "../Camera";
import type { RendererEvent } from "../MapRenderer";
import { distanceSquared, isFinitePoint } from "../utils/math";

/** Draws semantically colored event markers and provides marker hit testing for React tooltips. */
export class EventLayer {
  public draw(context: CanvasRenderingContext2D, camera: Camera, events: readonly RendererEvent[], playbackTime: number, hoveredId: string | null): void {
    context.save();
    camera.apply(context);
    for (const event of events) {
      if (event.t > playbackTime || !isFinitePoint(event.x, event.y)) continue;
      const hovered = event.id === hoveredId;
      this.drawMarker(context, camera, event, hovered);
    }
    context.restore();
  }

  /** Returns the visible event under a CSS-pixel pointer location, if any. */
  public hitTest(camera: Camera, events: readonly RendererEvent[], playbackTime: number, screenX: number, screenY: number): RendererEvent | null {
    const radius = 10;
    let result: RendererEvent | null = null;
    let closest = radius * radius;
    for (const event of events) {
      if (event.t > playbackTime || !isFinitePoint(event.x, event.y)) continue;
      const point = camera.mapToScreen(event.x, event.y);
      const distance = distanceSquared(point.x, point.y, screenX, screenY);
      if (distance <= closest) { closest = distance; result = event; }
    }
    return result;
  }

  private drawMarker(context: CanvasRenderingContext2D, camera: Camera, event: RendererEvent, hovered: boolean): void {
    const size = (hovered ? 9 : 7) * (0.8 + Math.min(camera.currentZoom, 3) * 0.2) / camera.scale;
    const color = this.colorFor(event.type);
    context.save();
    context.translate(event.x, event.y);
    context.fillStyle = color;
    context.strokeStyle = hovered ? "#e6edf7" : "#111827";
    context.lineWidth = 1.5 / camera.scale;
    if (event.type === "Loot") {
      context.rotate(Math.PI / 4);
      context.fillRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
      context.strokeRect(-size * 0.7, -size * 0.7, size * 1.4, size * 1.4);
    } else if (event.type === "KilledByStorm") {
      context.beginPath();
      context.arc(-size * 0.35, 0, size * 0.42, 0, Math.PI * 2);
      context.arc(size * 0.15, -size * 0.2, size * 0.52, 0, Math.PI * 2);
      context.arc(size * 0.55, size * 0.08, size * 0.34, 0, Math.PI * 2);
      context.fill(); context.stroke();
    } else if (event.type === "Kill" || event.type === "BotKill") {
      context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.stroke();
      context.beginPath(); context.moveTo(-size * 1.3, 0); context.lineTo(size * 1.3, 0); context.moveTo(0, -size * 1.3); context.lineTo(0, size * 1.3); context.stroke();
    } else {
      context.beginPath(); context.arc(0, 0, size, 0, Math.PI * 2); context.fill(); context.stroke();
      context.fillStyle = "#111827"; context.fillRect(-size * .5, -size * .12, size, size * .24);
    }
    context.restore();
  }

  private colorFor(type: string): string {
    if (type === "Kill" || type === "BotKill") return "#ef4444";
    if (type === "Killed" || type === "BotKilled") return "#fb923c";
    if (type === "Loot") return "#fbbf24";
    if (type === "KilledByStorm") return "#a855f7";
    return "#cbd5e1";
  }
}
