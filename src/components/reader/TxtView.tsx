import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { fontCss, resolveTheme, useReaderSettings } from "@/lib/reader-settings";
import { useTapZones } from "@/lib/use-tap-zones";
import type { SearchHit, TocItem, ViewHandle, ViewProps } from "./types";

const TxtView = forwardRef<ViewHandle, ViewProps>(function TxtView(
  { blob, initialLocation, onProgress, onToc, onTap },
  ref,
) {
  const [text, setText] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const settings = useReaderSettings();
  const theme = resolveTheme(settings);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const [offset, setOffset] = useState(0);
  const [pageWidth, setPageWidth] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const paged = settings.pageMode === "paged";

  useEffect(() => {
    blob.text().then((t) => setText(t));
  }, [blob]);

  const chapters = useMemo(() => {
    const lines = text.split("\n");
    const items: TocItem[] = [];
    let pos = 0;
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (
        trimmed &&
        trimmed.length < 80 &&
        /^(cap[íi]tulo|chapter|parte|part|\d+\s*[-.–]|[IVXLC]+\.)/i.test(trimmed)
      ) {
        items.push({ label: trimmed, href: String(pos), depth: 0 });
      }
      pos += line.length + 1;
    });
    return items;
  }, [text]);

  useEffect(() => {
    if (text) onToc(chapters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapters, text]);

  // mede paginação
  useEffect(() => {
    const el = contentRef.current;
    const host = scrollerRef.current;
    if (!el || !host || !text) return;
    const measure = () => {
      const w = host.clientWidth;
      setPageWidth(w);
      setTotalPages(Math.max(1, Math.ceil(el.scrollWidth / w)));
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [text, settings.fontSize, settings.lineHeight, settings.margin, settings.fontFamily, paged]);

  // restaura posição inicial
  const restored = useRef(false);
  useEffect(() => {
    if (!text || restored.current) return;
    restored.current = true;
    const start = Number(initialLocation) || 0;
    if (!start) return;
    if (paged) setOffset(Math.floor((start / Math.max(text.length, 1)) * totalPages));
    else if (scrollerRef.current)
      scrollerRef.current.scrollTop =
        (start / Math.max(text.length, 1)) * scrollerRef.current.scrollHeight;
  }, [text, totalPages, initialLocation, paged]);

  useEffect(() => {
    if (!text) return;
    if (paged) {
      const pct = totalPages > 1 ? offset / (totalPages - 1) : 0;
      onProgressRef.current(pct, String(Math.floor(pct * text.length)), `${offset + 1}/${totalPages}`);
    }
  }, [offset, totalPages, text, paged]);

  const go = (delta: number) =>
    setOffset((o) => Math.min(Math.max(o + delta, 0), Math.max(totalPages - 1, 0)));

  useImperativeHandle(ref, () => ({
    next: () => (paged ? go(1) : scrollerRef.current?.scrollBy(0, scrollerRef.current.clientHeight * 0.9)),
    prev: () => (paged ? go(-1) : scrollerRef.current?.scrollBy(0, -scrollerRef.current!.clientHeight * 0.9)),
    goTo: (href: string) => {
      const pos = Number(href) || 0;
      const pct = pos / Math.max(text.length, 1);
      if (paged) setOffset(Math.floor(pct * Math.max(totalPages - 1, 0)));
      else if (scrollerRef.current)
        scrollerRef.current.scrollTop = pct * scrollerRef.current.scrollHeight;
    },
    currentLocation: () => {
      if (paged) return String(Math.floor((offset / Math.max(totalPages - 1, 1)) * text.length));
      const s = scrollerRef.current;
      return String(Math.floor(((s?.scrollTop ?? 0) / Math.max(s?.scrollHeight ?? 1, 1)) * text.length));
    },
    scrollBy: (px: number) => scrollerRef.current?.scrollBy(0, px),
    selection: () => {
      const sel = window.getSelection();
      const t = sel?.toString().trim();
      if (!t) return null;
      return { text: t, location: String(text.indexOf(t)) };
    },
    search: async (query: string) => {
      if (!query) return [];
      const hits: SearchHit[] = [];
      const lower = text.toLowerCase();
      const q = query.toLowerCase();
      let idx = lower.indexOf(q);
      while (idx >= 0 && hits.length < 120) {
        hits.push({
          label: query,
          href: String(idx),
          excerpt: text.slice(Math.max(0, idx - 40), idx + 80).replace(/\s+/g, " ").trim(),
        });
        idx = lower.indexOf(q, idx + q.length);
      }
      return hits;
    },
  }));

  const tap = useTapZones(onTap, (dir) => go(dir === "left" ? 1 : -1), settings.swipeGesture);

  const typography: React.CSSProperties = {
    fontFamily: fontCss(settings.fontFamily),
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    textAlign: settings.align,
    fontWeight: settings.bold ? 600 : 400,
    letterSpacing: settings.letterSpacing,
    color: theme.fg,
    whiteSpace: "pre-wrap",
  };

  return (
    <div
      ref={scrollerRef}
      className={paged ? "h-full w-full overflow-hidden" : "h-full w-full overflow-y-auto"}
      style={{ background: theme.bg, padding: settings.margin }}
      onScroll={() => {
        if (paged || !text) return;
        const s = scrollerRef.current!;
        const pct = s.scrollTop / Math.max(s.scrollHeight - s.clientHeight, 1);
        onProgressRef.current(pct, String(Math.floor(pct * text.length)), `${Math.round(pct * 100)}%`);
      }}
      {...tap}
    >
      <div
        ref={contentRef}
        style={
          paged
            ? {
                ...typography,
                height: "100%",
                columnWidth: pageWidth ? pageWidth - settings.margin * 2 : undefined,
                columnGap: settings.margin * 2,
                transform: `translateX(-${offset * pageWidth}px)`,
                transition: settings.animation === "none" ? undefined : "transform 200ms ease",
              }
            : typography
        }
      >
        {text}
      </div>
    </div>
  );
});

export default TxtView;
