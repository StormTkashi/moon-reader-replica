import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type PageFlipHandle = { flip: (dir: "next" | "prev") => void };

/** Efeito de folhagem: uma folha vira sobre a página, como no Moon+ Reader. */
const PageFlip = forwardRef<PageFlipHandle, { color: string }>(function PageFlip(
  { color },
  ref,
) {
  const [dir, setDir] = useState<"next" | "prev" | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useImperativeHandle(ref, () => ({
    flip: (d) => {
      if (timer.current) clearTimeout(timer.current);
      setDir(null);
      requestAnimationFrame(() => setDir(d));
      timer.current = setTimeout(() => setDir(null), 520);
    },
  }));

  if (!dir) return null;
  const next = dir === "next";

  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 overflow-hidden"
      style={{ perspective: "1800px" }}
      aria-hidden
    >
      <div
        className={next ? "animate-page-flip-next" : "animate-page-flip-prev"}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          width: "50%",
          [next ? "right" : "left"]: 0,
          transformOrigin: next ? "left center" : "right center",
          transformStyle: "preserve-3d",
          background: color,
          backgroundImage: next
            ? "linear-gradient(to left, rgba(0,0,0,0.32), rgba(0,0,0,0) 55%)"
            : "linear-gradient(to right, rgba(0,0,0,0.32), rgba(0,0,0,0) 55%)",
          boxShadow: next ? "-12px 0 24px rgba(0,0,0,0.35)" : "12px 0 24px rgba(0,0,0,0.35)",
          backfaceVisibility: "hidden",
        }}
      />
    </div>
  );
});

export default PageFlip;
