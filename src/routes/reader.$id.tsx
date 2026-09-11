import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BookmarkPlus,
  Highlighter,
  List,
  Minus,
  Moon,
  PauseCircle,
  PlayCircle,
  Plus,
  Search,
  Settings2,
  Sun,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { SettingsPanel } from "@/components/reader/SettingsPanel";
import PageFlip, { type PageFlipHandle } from "@/components/reader/PageFlip";
import type { SearchHit, TocItem, ViewHandle } from "@/components/reader/types";
import {
  addBookmark,
  addReadingTime,
  deleteBookmark,
  deleteHighlight,
  getBook,
  getFile,
  listBookmarks,
  listHighlights,
  saveHighlight,
  uid,
  updateBook,
  type BookMeta,
  type Bookmark as BookmarkType,
  type Highlight,
  type HighlightColor,
} from "@/lib/db";
import { READER_THEMES, resolveTheme, useReaderSettings } from "@/lib/reader-settings";

const EpubView = lazy(() => import("@/components/reader/EpubView"));
const PdfView = lazy(() => import("@/components/reader/PdfView"));
const TxtView = lazy(() => import("@/components/reader/TxtView"));

export const Route = createFileRoute("/reader/$id")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { loc?: string } =>
    typeof search['loc'] === "string" ? { loc: search['loc'] as string } : {},
  head: () => ({
    meta: [
      { title: "Leitura — Lumen Reader" },
      { name: "description", content: "Leia com temas, marcações, notas e rolagem automática." },
      { property: "og:title", content: "Leitura — Lumen Reader" },
      { property: "og:description", content: "Tela de leitura do Lumen Reader." },
    ],
  }),
  component: ReaderPage,
});

const HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "yellow", hex: "#f2c14e" },
  { id: "green", hex: "#7bbf6a" },
  { id: "blue", hex: "#6aa7d8" },
  { id: "pink", hex: "#e08aa8" },
  { id: "purple", hex: "#a78bd8" },
];

function ReaderPage() {
  const { id } = Route.useParams();
  const { loc } = Route.useSearch();
  const navigate = useNavigate();
  const settings = useReaderSettings();
  const theme = resolveTheme(settings);

  const [book, setBook] = useState<BookMeta | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chrome, setChrome] = useState(true);
  const [panel, setPanel] = useState<null | "nav" | "settings">(null);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pageLabel, setPageLabel] = useState("");
  const viewRef = useRef<ViewHandle>(null);
  const flipRef = useRef<PageFlipHandle>(null);
  const locationRef = useRef("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const meta = await getBook(id);
      const file = await getFile(id);
      if (!alive) return;
      if (!meta || !file) {
        setError("Livro não encontrado na estante deste aparelho.");
        return;
      }
      setBook(meta);
      setBlob(file);
      setProgress(meta.progress);
      locationRef.current = meta.location;
      await updateBook(id, { lastOpenedAt: Date.now() });
      setBookmarks(await listBookmarks(id));
      setHighlights(await listHighlights(id));
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // tempo de leitura
  useEffect(() => {
    if (!book) return;
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") void addReadingTime(id, 15);
    }, 15000);
    return () => clearInterval(interval);
  }, [book, id]);

  // manter tela ligada
  useEffect(() => {
    if (!settings.keepAwake) return;
    let sentinel: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    nav.wakeLock?.request("screen").then((s) => (sentinel = s)).catch(() => undefined);
    return () => {
      void sentinel?.release().catch(() => undefined);
    };
  }, [settings.keepAwake]);

  // travar orientação
  useEffect(() => {
    const so = screen.orientation as ScreenOrientation & {
      lock?: (o: string) => Promise<void>;
      unlock?: () => void;
    };
    if (settings.orientationLock === "auto") so?.unlock?.();
    else so?.lock?.(settings.orientationLock).catch(() => undefined);
  }, [settings.orientationLock]);

  // tela cheia
  useEffect(() => {
    if (settings.fullscreen && !document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => undefined);
    } else if (!settings.fullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => undefined);
    }
  }, [settings.fullscreen]);

  const onProgress = useCallback(
    (pct: number, location: string, label: string) => {
      setProgress(pct);
      setPageLabel(label);
      locationRef.current = location;
      void updateBook(id, {
        progress: pct,
        location,
        finished: pct > 0.985,
        lastOpenedAt: Date.now(),
      });
    },
    [id],
  );

  const doAction = useCallback(
    (action: string) => {
      switch (action) {
        case "next":
          if (settings.animation === "curl" && settings.pageMode === "paged")
            flipRef.current?.flip("next");
          viewRef.current?.next();
          break;
        case "prev":
          if (settings.animation === "curl" && settings.pageMode === "paged")
            flipRef.current?.flip("prev");
          viewRef.current?.prev();
          break;
        case "menu":
          setChrome((c) => !c);
          break;
        case "bookmark":
          void addCurrentBookmark();
          break;
        case "autoscroll":
          setAutoScroll((a) => !a);
          break;
        case "theme": {
          const idx = READER_THEMES.findIndex((t) => t.id === settings.themeId);
          settings.set({ themeId: READER_THEMES[(idx + 1) % READER_THEMES.length]!.id });
          break;
        }
        default:
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [settings.themeId],
  );

  async function addCurrentBookmark() {
    const location = viewRef.current?.currentLocation() || locationRef.current;
    const bm: BookmarkType = {
      id: uid(),
      bookId: id,
      location,
      label: pageLabel || `${Math.round(progress * 100)}%`,
      createdAt: Date.now(),
    };
    await addBookmark(bm);
    setBookmarks(await listBookmarks(id));
    toast.success("Marcador adicionado");
  }

  async function addHighlight(color: HighlightColor) {
    const sel = viewRef.current?.selection?.();
    if (!sel) {
      toast.error("Selecione um trecho do texto primeiro");
      return;
    }
    const note = window.prompt("Nota (opcional)", "") ?? "";
    const h: Highlight = {
      id: uid(),
      bookId: id,
      location: sel.location,
      text: sel.text,
      note,
      color,
      createdAt: Date.now(),
    };
    await saveHighlight(h);
    setHighlights(await listHighlights(id));
    toast.success("Trecho destacado");
  }

  // teclado / botões de volume
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowRight", "PageDown", " "].includes(e.key)) doAction("next");
      if (["ArrowLeft", "PageUp"].includes(e.key)) doAction("prev");
      if (settings.volumeKeys && (e.key === "AudioVolumeDown" || e.key === "VolumeDown"))
        doAction("next");
      if (settings.volumeKeys && (e.key === "AudioVolumeUp" || e.key === "VolumeUp"))
        doAction("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [doAction, settings.volumeKeys]);

  // rolagem automática
  useEffect(() => {
    if (!autoScroll) return;
    const step = Math.max(1, Math.round(settings.autoScrollSpeed / 12));
    const timer = setInterval(() => {
      if (viewRef.current?.scrollBy) viewRef.current.scrollBy(step);
      else viewRef.current?.next();
    }, 80);
    return () => clearInterval(timer);
  }, [autoScroll, settings.autoScrollSpeed]);

  const ViewComponent = useMemo(() => {
    if (!book) return null;
    return book.format === "epub" ? EpubView : book.format === "pdf" ? PdfView : TxtView;
  }, [book]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => navigate({ to: "/" })}>Voltar para a estante</Button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden" style={{ background: theme.bg }}>
      <div
        className="absolute inset-0"
        style={{ filter: `brightness(${settings.brightness})` }}
        onDoubleClick={() => setChrome((c) => !c)}
      >
        {book && blob && ViewComponent ? (
          <Suspense
            fallback={
              <p className="pt-20 text-center text-sm" style={{ color: theme.fg }}>
                Abrindo livro…
              </p>
            }
          >
            <ViewComponent
              ref={viewRef}
              blob={blob}
              initialLocation={loc || book.location}
              onProgress={onProgress}
              onToc={setToc}
              onTap={(zone) =>
                doAction(
                  zone === "left"
                    ? settings.tapLeft
                    : zone === "right"
                      ? settings.tapRight
                      : settings.tapCenter,
                )
              }
            />
          </Suspense>
        ) : (

          <p className="pt-20 text-center text-sm" style={{ color: theme.fg }}>
            Carregando…
          </p>
        )}
      </div>

      {settings.showStatusBar && !chrome && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between px-4 pb-1 text-[11px] opacity-70"
          style={{ color: theme.fg }}
        >
          <span className="max-w-[60%] truncate">{book?.title}</span>
          <span>
            {pageLabel || `${Math.round(progress * 100)}%`}
            {autoScroll ? " · auto" : ""}
          </span>
        </div>
      )}

      {chrome && (
        <>
          <div className="absolute inset-x-0 top-0 z-20 flex items-center gap-2 border-b border-border bg-card/95 px-2 py-2 backdrop-blur">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/" })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{book?.title ?? "Carregando"}</p>
              <p className="truncate text-[11px] text-muted-foreground">{book?.author}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => void addCurrentBookmark()}>
              <BookmarkPlus className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setPanel("nav")}>
              <List className="h-5 w-5" />
            </Button>
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 space-y-2 border-t border-border bg-card/95 px-3 pb-3 pt-2 backdrop-blur">
            <div className="flex items-center gap-3">
              <span className="w-10 text-right text-[11px] text-muted-foreground">
                {Math.round(progress * 100)}%
              </span>
              <Slider
                className="flex-1"
                min={0}
                max={100}
                value={[Math.round(progress * 100)]}
                onValueCommit={(vals) => viewRef.current?.goToPercent?.((vals[0] ?? 0) / 100)}
              />
              <span className="w-12 text-[11px] text-muted-foreground">{pageLabel}</span>
            </div>
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => doAction("prev")}>
                <Minus className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setAutoScroll((a) => !a)}>
                {autoScroll ? (
                  <PauseCircle className="h-5 w-5 text-primary" />
                ) : (
                  <PlayCircle className="h-5 w-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  settings.set({ themeId: theme.dark ? "day" : "night" })
                }
              >
                {theme.dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPanel("settings")}>
                <Settings2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => doAction("next")}>
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <Highlighter className="h-4 w-4 text-muted-foreground" />
              {HIGHLIGHT_COLORS.map((c) => (
                <button
                  key={c.id}
                  aria-label={`Destacar em ${c.id}`}
                  onClick={() => void addHighlight(c.id)}
                  className="h-6 w-6 rounded-full border border-border"
                  style={{ background: c.hex }}
                />
              ))}
            </div>
          </div>
        </>
      )}

      <Sheet open={panel === "nav"} onOpenChange={(o) => setPanel(o ? "nav" : null)}>
        <SheetContent side="left" className="w-[88vw] overflow-y-auto sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="toc" className="mt-3 px-4 pb-8">
            <TabsList className="w-full">
              <TabsTrigger value="toc" className="flex-1">
                Sumário
              </TabsTrigger>
              <TabsTrigger value="marks" className="flex-1">
                Marcadores
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">
                Notas
              </TabsTrigger>
              <TabsTrigger value="search" className="flex-1">
                Busca
              </TabsTrigger>
            </TabsList>

            <TabsContent value="toc" className="pt-3">
              {toc.length === 0 ? (
                <p className="text-sm text-muted-foreground">Este livro não tem sumário.</p>
              ) : (
                <ul className="space-y-1">
                  {toc.map((item, i) => (
                    <li key={`${item.href}-${i}`}>
                      <button
                        className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                        style={{ paddingLeft: 8 + item.depth * 14 }}
                        onClick={() => {
                          viewRef.current?.goTo(item.href);
                          setPanel(null);
                        }}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="marks" className="pt-3">
              {bookmarks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum marcador ainda.</p>
              ) : (
                <ul className="space-y-1">
                  {bookmarks.map((b) => (
                    <li key={b.id} className="flex items-center gap-2">
                      <button
                        className="flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                        onClick={() => {
                          viewRef.current?.goTo(b.location);
                          setPanel(null);
                        }}
                      >
                        <Bookmark className="h-4 w-4 text-primary" />
                        {b.label}
                      </button>
                      <button
                        className="p-2 text-muted-foreground"
                        onClick={async () => {
                          await deleteBookmark(b.id);
                          setBookmarks(await listBookmarks(id));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="notes" className="pt-3">
              {highlights.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Selecione um trecho e escolha uma cor para destacar.
                </p>
              ) : (
                <ul className="space-y-2">
                  {highlights.map((h) => (
                    <li key={h.id} className="rounded-md border border-border p-2">
                      <button
                        className="text-left text-sm"
                        onClick={() => {
                          viewRef.current?.goTo(h.location);
                          setPanel(null);
                        }}
                      >
                        <span
                          className="mr-1 inline-block h-2 w-2 rounded-full align-middle"
                          style={{
                            background: HIGHLIGHT_COLORS.find((c) => c.id === h.color)?.hex,
                          }}
                        />
                        {h.text.slice(0, 160)}
                      </button>
                      {h.note && <p className="mt-1 text-xs text-muted-foreground">{h.note}</p>}
                      <button
                        className="mt-1 text-xs text-destructive"
                        onClick={async () => {
                          await deleteHighlight(h.id);
                          setHighlights(await listHighlights(id));
                        }}
                      >
                        Remover
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>

            <TabsContent value="search" className="pt-3">
              <form
                className="flex gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setSearching(true);
                  setHits((await viewRef.current?.search(query)) ?? []);
                  setSearching(false);
                }}
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar no livro"
                />
                <Button type="submit" size="icon" disabled={searching}>
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <ul className="mt-3 space-y-1">
                {searching && <li className="text-sm text-muted-foreground">Procurando…</li>}
                {!searching && hits.length === 0 && query && (
                  <li className="text-sm text-muted-foreground">Nada encontrado.</li>
                )}
                {hits.map((h, i) => (
                  <li key={i}>
                    <button
                      className="w-full rounded-md px-2 py-2 text-left text-xs hover:bg-accent"
                      onClick={() => {
                        viewRef.current?.goTo(h.href);
                        setPanel(null);
                      }}
                    >
                      {h.excerpt}
                    </button>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <Sheet open={panel === "settings"} onOpenChange={(o) => setPanel(o ? "settings" : null)}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Ajustes de leitura</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-8">
            <SettingsPanel />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
