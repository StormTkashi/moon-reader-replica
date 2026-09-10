import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { BookmarkIcon, ChevronDown, ChevronRight, Highlighter, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/Cover";
import {
  deleteBookmark,
  deleteHighlight,
  listBookmarks,
  listBooks,
  listHighlights,
  type BookMeta,
  type Bookmark,
  type Highlight,
} from "@/lib/db";

export const Route = createFileRoute("/marks")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Marcadores — Lumen Reader" },
      {
        name: "description",
        content: "Todos os seus marcadores, destaques e notas reunidos por livro.",
      },
      { property: "og:title", content: "Marcadores — Lumen Reader" },
      {
        property: "og:description",
        content: "Volte direto ao trecho marcado em qualquer livro da sua estante.",
      },
    ],
  }),
  component: MarksPage,
});

const COLORS: Record<string, string> = {
  yellow: "#f2c14e",
  green: "#7bbf6a",
  blue: "#6aa7d8",
  pink: "#e08aa8",
  purple: "#a78bd8",
};

interface Entry {
  book: BookMeta;
  bookmarks: Bookmark[];
  highlights: Highlight[];
}

function MarksPage() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const books = await listBooks();
    const all = await Promise.all(
      books.map(async (book) => ({
        book,
        bookmarks: await listBookmarks(book.id),
        highlights: await listHighlights(book.id),
      })),
    );
    setEntries(all.filter((e) => e.bookmarks.length + e.highlights.length > 0));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function open(bookId: string, location: string) {
    void navigate({ to: "/reader/$id", params: { id: bookId }, search: { loc: location } });
  }

  return (
    <AppShell title="Marcadores">
      <main className="mx-auto max-w-2xl px-4 py-4">
        {entries === null ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : entries.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Você ainda não marcou nada. Selecione uma frase durante a leitura para destacá-la.
          </p>
        ) : (
          <ul className="space-y-3">
            {entries.map(({ book, bookmarks, highlights }) => {
              const expanded = openId === book.id;
              const total = bookmarks.length + highlights.length;
              return (
                <li key={book.id} className="overflow-hidden rounded-xl border border-border">
                  <button
                    className="flex w-full items-center gap-3 bg-card p-3 text-left"
                    onClick={() => setOpenId(expanded ? null : book.id)}
                  >
                    <Cover book={book} className="h-20 w-14" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{book.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                      <p className="mt-1 text-xs text-primary">{total} marcação(ões)</p>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {expanded && (
                    <ul className="divide-y divide-border border-t border-border">
                      {bookmarks.map((b) => (
                        <li key={b.id} className="flex items-start gap-2 p-3">
                          <button
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            onClick={() => open(book.id, b.location)}
                          >
                            <BookmarkIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                            <div className="min-w-0">
                              <p className="truncate text-sm">{b.label || "Marcador"}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(b.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </button>
                          <button
                            aria-label="Apagar marcador"
                            className="rounded-md p-1 text-muted-foreground"
                            onClick={async () => {
                              await deleteBookmark(b.id);
                              await refresh();
                              toast.success("Marcador apagado");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                      {highlights.map((h) => (
                        <li key={h.id} className="flex items-start gap-2 p-3">
                          <button
                            className="flex min-w-0 flex-1 items-start gap-2 text-left"
                            onClick={() => open(book.id, h.location)}
                          >
                            <Highlighter
                              className="mt-0.5 h-4 w-4 shrink-0"
                              style={{ color: COLORS[h.color] ?? "#f2c14e" }}
                            />
                            <div className="min-w-0">
                              <p className="line-clamp-3 text-sm">{h.text}</p>
                              {h.note && (
                                <p className="mt-1 line-clamp-2 text-xs italic text-muted-foreground">
                                  {h.note}
                                </p>
                              )}
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {new Date(h.createdAt).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                          </button>
                          <button
                            aria-label="Apagar destaque"
                            className="rounded-md p-1 text-muted-foreground"
                            onClick={async () => {
                              await deleteHighlight(h.id);
                              await refresh();
                              toast.success("Destaque apagado");
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
