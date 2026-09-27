import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { resolveTheme, useReaderSettings } from "@/lib/reader-settings";
import { useTapZones } from "@/lib/use-tap-zones";
import type { SearchHit, TocItem, ViewHandle, ViewProps } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any;

const PdfView = forwardRef<ViewHandle, ViewProps>(function PdfView(
  { blob, initialLocation, highlights, onProgress, onToc, onTap },
  ref,
) {
  const docRef = useRef<AnyDoc>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Number(initialLocation) || 1);
  const settings = useReaderSettings();
  const theme = resolveTheme(settings);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const pdfjs = await import("pdfjs-dist");
      const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;
      if (cancelled) return;
      docRef.current = doc;
      setTotal(doc.numPages);
      try {
        const outline = await doc.getOutline();
        const items: TocItem[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const walk = async (list: any[], depth: number) => {
          for (const it of list ?? []) {
            let target = "1";
            try {
              const dest = typeof it.dest === "string" ? await doc.getDestination(it.dest) : it.dest;
              const index = await doc.getPageIndex(dest[0]);
              target = String(index + 1);
            } catch {
              /* noop */
            }
            items.push({ label: it.title, href: target, depth });
            if (it.items?.length) await walk(it.items, depth + 1);
          }
        };
        await walk(outline ?? [], 0);
        onToc(items);
      } catch {
        onToc([]);
      }
    })();
    return () => {
      cancelled = true;
      docRef.current?.destroy?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const doc = docRef.current;
      const canvas = canvasRef.current;
      const host = containerRef.current;
      if (!doc || !canvas || !host) return;
      const p = await doc.getPage(Math.min(Math.max(page, 1), doc.numPages));
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const scale = ((host.clientWidth - settings.margin * 2) / base.width) * 2;
      const viewport = p.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / 2}px`;
      canvas.style.height = `${viewport.height / 2}px`;
      const ctx = canvas.getContext("2d")!;
      await p.render({ canvasContext: ctx, viewport }).promise;
      if (cancelled) return;
      // camada de texto invisível para permitir selecionar
      const layer = textRef.current;
      if (layer) {
        layer.innerHTML = "";
        const cssViewport = p.getViewport({ scale: scale / 2 });
        layer.style.width = `${cssViewport.width}px`;
        layer.style.height = `${cssViewport.height}px`;
        layer.style.setProperty("--scale-factor", String(scale / 2));
        const pdfjs = await import("pdfjs-dist");
        const tl = new pdfjs.TextLayer({
          textContentSource: await p.getTextContent(),
          container: layer,
          viewport: cssViewport,
        });
        await tl.render();
        if (!cancelled) setRendered((n) => n + 1);
      }
      onProgressRef.current(doc.numPages ? page / doc.numPages : 0, String(page), `${page}/${doc.numPages}`);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, total, settings.margin, settings.fontSize]);

  const go = (delta: number) =>
    setPage((p) => Math.min(Math.max(p + delta, 1), total || 1));

  useImperativeHandle(ref, () => ({
    next: () => go(1),
    prev: () => go(-1),
    goTo: (href: string) => setPage(Math.min(Math.max(Number(href) || 1, 1), total || 1)),
    goToPercent: (pct: number) =>
      setPage(Math.min(Math.max(Math.round(pct * (total || 1)), 1), total || 1)),
    currentLocation: () => String(page),
    scrollBy: (px: number) => containerRef.current?.scrollBy(0, px),
    selection: () => {
      const sel = window.getSelection();
      const layer = textRef.current;
      if (!sel || sel.isCollapsed || !layer || !sel.rangeCount) return null;
      const range = sel.getRangeAt(0);
      if (!layer.contains(range.commonAncestorContainer)) return null;
      const text = sel.toString().trim();
      if (!text) return null;
      const r = range.getBoundingClientRect();
      return { text, location: String(page), rect: { top: r.top, left: r.left, width: r.width, height: r.height } };
    },
    clearSelection: () => window.getSelection()?.removeAllRanges(),
    search: async (query: string) => {
      const doc = docRef.current;
      if (!doc || !query) return [];
      const hits: SearchHit[] = [];
      const q = query.toLowerCase();
      for (let i = 1; i <= doc.numPages && hits.length < 120; i++) {
        const content = await doc.getPage(i).then((p: AnyDoc) => p.getTextContent());
        const text = content.items.map((it: { str?: string }) => it.str ?? "").join(" ");
        const idx = text.toLowerCase().indexOf(q);
        if (idx >= 0) {
          hits.push({
            label: `Página ${i}`,
            href: String(i),
            excerpt: text.slice(Math.max(0, idx - 40), idx + 80).trim(),
          });
        }
      }
      return hits;
    },
  }));

  // pinta os trechos marcados nesta página
  useEffect(() => {
    const layer = textRef.current;
    if (!layer) return;
    const spans = Array.from(layer.querySelectorAll("span")) as HTMLSpanElement[];
    spans.forEach((sp) => {
      sp.style.background = "";
      sp.style.borderBottom = "";
    });
    const colors: Record<string, string> = {
      yellow: "rgba(250,204,21,.45)", green: "rgba(74,222,128,.45)", blue: "rgba(96,165,250,.45)",
      pink: "rgba(244,114,182,.45)", purple: "rgba(192,132,252,.45)", orange: "rgba(251,146,60,.45)",
    };
    const norm = (t: string) => t.replace(/\s+/g, " ").trim();
    for (const h of highlights ?? []) {
      if (String(h.location) !== String(page) || !h.text) continue;
      const target = norm(h.text);
      const c = colors[h.color as string] ?? "rgba(250,204,21,.45)";
      spans.forEach((sp) => {
        const t = norm(sp.textContent ?? "");
        if (t.length > 1 && (target.includes(t) || t.includes(target))) {
          sp.style.background = c;
        }
      });
    }
  }, [highlights, page, rendered]);

  const tap = useTapZones(
    (zone) => {
      if (window.getSelection()?.toString()) return;
      onTap(zone);
    },
    (dir) => go(dir === "left" ? 1 : -1),
    settings.swipeGesture,
  );

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-auto"
      style={{ background: theme.bg, padding: settings.margin }}
      {...tap}
    >
      <div className="relative mx-auto w-fit">
        <canvas ref={canvasRef} className="block" />
        <div ref={textRef} className="pdf-text-layer" />
      </div>
    </div>
  );
});

export default PdfView;
