/** Resizes a canvas for a high-DPI display and returns its CSS pixel dimensions. */
export function resizeCanvas(canvas: HTMLCanvasElement, width: number, height: number): { width: number; height: number } {
  const safeWidth = Math.max(1, Math.round(width));
  const safeHeight = Math.max(1, Math.round(height));
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const bitmapWidth = Math.round(safeWidth * ratio);
  const bitmapHeight = Math.round(safeHeight * ratio);

  if (canvas.width !== bitmapWidth || canvas.height !== bitmapHeight) {
    canvas.width = bitmapWidth;
    canvas.height = bitmapHeight;
  }
  canvas.style.width = `${safeWidth}px`;
  canvas.style.height = `${safeHeight}px`;
  return { width: safeWidth, height: safeHeight };
}

/** Establishes CSS-pixel coordinates after a high-DPI canvas resize. */
export function beginFrame(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
  const ratio = canvas.width / Math.max(1, canvas.clientWidth);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
}
