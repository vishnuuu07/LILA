/** Numeric helpers shared by the canvas renderer. */
export const MAP_SIZE = 1024;

/** Limits a number to the inclusive range. */
export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/** Returns whether a point can safely be sent to the Canvas API. */
export function isFinitePoint(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y);
}

/** Squared distance avoids a square root in pointer hit tests. */
export function distanceSquared(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

/** Squared distance from a point to a finite line segment in screen space. */
export function pointToSegmentDistanceSquared(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return distanceSquared(px, py, ax, ay);
  const projection = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
  return distanceSquared(px, py, ax + projection * dx, ay + projection * dy);
}
