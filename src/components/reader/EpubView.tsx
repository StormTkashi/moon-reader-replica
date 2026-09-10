import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { fontCss, resolveTheme, useReaderSettings } from "@/lib/reader-settings";
import type { SearchHit, TocItem, ViewHandle, ViewProps } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyBook = any;

const EpubView = forwardRef<ViewHandle, ViewProps>(function EpubView(
  { blob, initialLocation, onProgress, onToc, onTap },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<AnyBook>(null);
  const renditionRef = useRef<AnyBook>(null);
  const [ready, setReady] = useState(false);
  const settings = useReaderSettings();
  const theme = resolveTheme(settings);
  const onTapRef = useRef(onTap);
  onTapRef.current = onTap;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    let cancelled = false;
    let rendition: AnyBook = null;
    (async () => {
      const ePub = (await import("epubjs")).default;
      const buffer = await blob.arrayBuffer();
      if (cancelled || !hostRef.current) return;
      const book = ePub(buffer) as AnyBook;
      bookRef.current = book;
      rendition = book.renderTo(hostRef.current, {
        width: "100%",
        height: "100%",
        flow: useReaderSettings.getState().pageMode === "scroll" ? "scrolled-doc" : "paginated",
        spread: "none",
        allowScriptedContent: true,
      });
      renditionRef.current = rendition;
      await rendition.display(initialLocation || undefined);
      if (cancelled) return;
      setReady(true);

      const nav = await book.loaded.navigation;
      const items: TocItem[] = [];
      const walk = (list: AnyBook[], depth: number) => {
        list?.forEach((it) => {
          items.push({ label: it.label?.trim() ?? "", href: it.href, depth });
          if (it.subitems?.length) walk(it.subitems, depth + 1);
        });
      };
      walk(nav.toc, 0);
      onToc(items);

      await book.locations.generate(1200).catch(() => undefined);

      rendition.on("relocated", (location: AnyBook) => {
        const cfi = location?.start?.cfi ?? "";
        const pct = book.locations.length()
          ? book.locations.percentageFromCfi(cfi) || 0
          : (location?.start?.percentage ?? 0);
        const page = location?.start?.displayed?.page ?? 0;
        const total = location?.start?.displayed?.total ?? 0;
        onProgressRef.current(pct, cfi, total ? `${page}/${total}` : "");
      });

      rendition.on("click", (e: MouseEvent) => {
        const w = hostRef.current?.clientWidth ?? 1;
        const rel = e.clientX / w;
        onTapRef.current(rel < 0.3 ? "left" : rel > 0.7 ? "right" : "center");
      });
    })();
    return () => {
      cancelled = true;
      try {
        rendition?.destroy();
        bookRef.current?.destroy();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob]);

  // Reaplica tema/tipografia
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || !ready) return;
    rendition.themes.register("app", {
      body: {
        background: theme.bg,
        color: theme.fg,
        "font-family": `${fontCss(settings.fontFamily)} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "text-align": `${settings.align} !important`,
        "font-weight": settings.bold ? "600 !important" : "inherit",
        "letter-spacing": `${settings.letterSpacing}px`,
        padding: `0 ${settings.margin}px`,
      },
      p: {
        "font-family": `${fontCss(settings.fontFamily)} !important`,
        "line-height": `${settings.lineHeight} !important`,
        "text-align": `${settings.align} !important`,
      },
      a: { color: `${theme.accent} !important` },
    });
    rendition.themes.select("app");
    rendition.themes.fontSize(`${settings.fontSize}px`);
  }, [ready, theme, settings]);

  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition || !ready) return;
    const flow = settings.pageMode === "scroll" ? "scrolled-doc" : "paginated";
    try {
      rendition.flow(flow);
    } catch {
      /* noop */
    }
  }, [settings.pageMode, ready]);

  useImperativeHandle(ref, () => ({
    next: () => renditionRef.current?.next(),
    prev: () => renditionRef.current?.prev(),
    goTo: (href: string) => renditionRef.current?.display(href),
    currentLocation: () => renditionRef.current?.currentLocation()?.start?.cfi ?? "",
    scrollBy: (px: number) => {
      const doc = renditionRef.current?.getContents?.()?.[0]?.document;
      doc?.defaultView?.scrollBy(0, px);
    },
    selection: () => {
      const contents = renditionRef.current?.getContents?.()?.[0];
      const sel = contents?.window?.getSelection?.();
      const text = sel?.toString()?.trim();
      if (!text) return null;
      const cfi = contents.cfiFromRange(sel.getRangeAt(0));
      return { text, location: cfi };
    },
    search: async (query: string) => {
      const book = bookRef.current;
      if (!book || !query) return [];
      const results: SearchHit[] = [];
      for (const item of book.spine.spineItems) {
        try {
          await item.load(book.load.bind(book));
          const found = item.find(query) as { cfi: string; excerpt: string }[];
          found.forEach((f) =>
            results.push({ label: query, href: f.cfi, excerpt: f.excerpt.trim() }),
          );
          item.unload();
        } catch {
          /* noop */
        }
        if (results.length > 120) break;
      }
      return results;
    },
  }));

  return <div ref={hostRef} className="h-full w-full" style={{ background: theme.bg }} />;
});

export default EpubView;
