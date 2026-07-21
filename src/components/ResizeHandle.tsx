import { useRef, type KeyboardEvent, type PointerEvent } from "react";

interface ResizeHandleProps { side: "left" | "right"; value: number; min: number; max: number; onChange: (value: number) => void; }

/** Accessible, pointer-captured rail separator. The map reflows through CSS grid variables. */
export function ResizeHandle({ side, value, min, max, onChange }: ResizeHandleProps) {
  const origin = useRef<{ x: number; value: number } | null>(null);
  const clamp = (next: number) => Math.max(min, Math.min(max, next));
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => { origin.current = { x: event.clientX, value }; event.currentTarget.setPointerCapture(event.pointerId); };
  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => { if (!origin.current) return; const delta = event.clientX - origin.current.x; onChange(clamp(origin.current.value + (side === "left" ? delta : -delta))); };
  const onPointerEnd = () => { origin.current = null; };
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => { const direction = side === "left" ? 1 : -1; if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); onChange(clamp(value + (event.key === "ArrowRight" ? 12 : -12) * direction)); } else if (event.key === "Home") { event.preventDefault(); onChange(min); } else if (event.key === "End") { event.preventDefault(); onChange(max); } };
  return <button type="button" className={`rail-resize-handle ${side}`} aria-label={`Resize ${side} panel`} aria-orientation="vertical" aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} role="separator" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd} onKeyDown={onKeyDown}><span /></button>;
}
