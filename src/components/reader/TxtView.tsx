import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { fontCss, resolveTheme, useReaderSettings } from "@/lib/reader-settings";
import { useTapZones } from "@/lib/use-tap-zones";
import type { SearchHit, TocItem, ViewHandle, ViewProps } from "./types";

const TxtView = forwardRef<ViewHandle, ViewProps>(function TxtView(
  { blob, initialLocation, highlights, onProgress, onToc, onTap },
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

  const markedText = useMemo(() => {
    const colors = {
      yellow: "#f2c14e",
      green: "#7bbf6a",
      blue: "#6aa7d8",
      pink: "#e08aa8",
      purple: "#a78bd8",
    } as const;
    const valid = highlights
      .map((highlight) => ({
        ...highlight,
        start: Number(highlight.location),
        end: Number(highlight.location) + highlight.text.length,
      }))
      .filter(
        (highlight) =>
          Number.isFinite(highlight.start) &&
          highlight.start >= 0 &&
          highlight.end > highlight.start &&
          highlight.end <= text.length,
      )
      .sort((a, b) => a.start - b.start || a.createdAt - b.createdAt);

    const nodes: React.ReactNode[] = [];
    let cursor = 0;
    valid.forEach((highlight) => {
      const start = Math.max(cursor, highlight.start);
      if (start >= highlight.end) return;
      if (start > cursor) nodes.push(text.slice(cursor, start));
      nodes.push(
        <mark
          key={highlight.id}
          className="rounded-[2px] text-inherit"
          style={
            highlight.style === "underline"
              ? {
                  backgroundColor: "transparent",
                  fontWeight: highlight.bold ? 700 : "inherit",
                  textDecoration: `underline 2px ${colors[highlight.color]}`,
                  textUnderlineOffset: 2,
                }
              : {
                  backgroundColor: colors[highlight.color],
                  fontWeight: highlight.bold ? 700 : "inherit",
                }
          }
        >
          {text.slice(start, highlight.end)}
        </mark>,
      );
      cursor = highlight.end;
    });
    if (cursor < text.length) nodes.push(text.slice(cursor));
    return nodes;
  }, [highlights, text]);

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
    const host = scrollerRef.current;
    if (!host) return;
    const measure = () => setPageWidth(host.clientWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el || !text || !pageWidth || !paged) return;
    const id = requestAnimationFrame(() =>
      setTotalPages(Math.max(1, Math.round(el.scrollWidth / pageWidth))),
    );
    return () => cancelAnimationFrame(id);
  }, [
    text,
    pageWidth,
    paged,
    settings.fontSize,
    settings.lineHeight,
    settings.margin,
    settings.fontFamily,
    settings.letterSpacing,
  ]);

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
    goToPercent: (pct: number) => {
      if (paged) setOffset(Math.round(pct * Math.max(totalPages - 1, 0)));
      else if (scrollerRef.current)
        scrollerRef.current.scrollTop =
          pct * (scrollerRef.current.scrollHeight - scrollerRef.current.clientHeight);
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
      const content = contentRef.current;
      if (!t || !sel || sel.rangeCount === 0 || !content) return null;
      const range = sel.getRangeAt(0);
      if (!content.contains(range.commonAncestorContainer)) return null;
      const r = range.getBoundingClientRect();
      const before = range.cloneRange();
      before.selectNodeContents(content);
      before.setEnd(range.startContainer, range.startOffset);
      const leadingWhitespace = sel.toString().length - sel.toString().trimStart().length;
      const host = scrollerRef.current?.getBoundingClientRect();
      return {
        text: t,
        location: String(before.toString().length + leadingWhitespace),
        rect: {
          top: r.top - (host?.top ?? 0),
          left: r.left - (host?.left ?? 0),
          width: r.width,
          height: r.height,
        },
      };
    },
    clearSelection: () => window.getSelection()?.removeAllRanges(),
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
        {markedText}
      </div>
    </div>
  );
});

export default TxtView;
