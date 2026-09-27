import { useRef } from "react";

function hasSelection() {
  if (typeof window === "undefined") return false;
  if (window.getSelection()?.toString().trim()) return true;
  // seleção dentro de iframes (EPUB)
  for (const f of Array.from(document.querySelectorAll("iframe"))) {
    try {
      if (f.contentWindow?.getSelection()?.toString().trim()) return true;
    } catch {
      /* noop */
    }
  }
  return false;
}

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
    onPointerCancel: () => {
      start.current = null;
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      // toque longo = seleção de texto no celular; não vira página
      if (Date.now() - s.t > 350) return;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;
      // espera o navegador terminar a seleção antes de decidir
      setTimeout(() => {
        if (hasSelection()) return;
        const dx = x - s.x;
        const dy = y - s.y;
        if (swipeEnabled && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
          onSwipe(dx < 0 ? "left" : "right");
          return;
        }
        if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
        const rel = (x - rect.left) / rect.width;
        onTap(rel < 0.3 ? "left" : rel > 0.7 ? "right" : "center");
      }, 60);
    },
  };
}
