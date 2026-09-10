import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { resolveTheme, useReaderSettings } from "@/lib/reader-settings";
import { useTapZones } from "@/lib/use-tap-zones";
import type { SearchHit, TocItem, ViewHandle, ViewProps } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDoc = any;

const PdfView = forwardRef<ViewHandle, ViewProps>(function PdfView(
  { blob, initialLocation, onProgress, onToc, onTap },
  ref,
) {
  const docRef = useRef<AnyDoc>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
      const ctx = canvas.getContext("2d")!;
      await p.render({ canvas, canvasContext: ctx, viewport }).promise;
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

  const tap = useTapZones(
    onTap,
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
      <canvas ref={canvasRef} className="mx-auto block" />
    </div>
  );
});

export default PdfView;
