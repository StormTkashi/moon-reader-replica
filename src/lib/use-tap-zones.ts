import { useRef } from "react";

export function useTapZones(
  onTap: (zone: "left" | "center" | "right") => void,
  onSwipe: (dir: "left" | "right") => void,
  swipeEnabled: boolean,
) {
  const start = useRef<{ x: number; y: number; t: number } | null>(null);

  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      const dy = e.clientY - s.y;
      if (swipeEnabled && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        onSwipe(dx < 0 ? "left" : "right");
        return;
      }
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const rel = (e.clientX - rect.left) / rect.width;
      onTap(rel < 0.3 ? "left" : rel > 0.7 ? "right" : "center");
    },
  };
}
