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
