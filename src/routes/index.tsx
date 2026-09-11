import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Check,
  FolderPlus,
  MoreVertical,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Cover, ProgressBar } from "@/components/Cover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteBook, listBooks, updateBook, type BookMeta } from "@/lib/db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Lumen Reader — sua estante de livros" },
      {
        name: "description",
        content:
          "Estante com seus livros em EPUB, PDF e TXT: progresso, etiquetas e leitura offline.",
      },
      { property: "og:title", content: "Lumen Reader — sua estante de livros" },
      {
        property: "og:description",
        content: "Abra EPUB, PDF e TXT com temas, marcações e estatísticas de leitura.",
      },
    ],
  }),
  component: Library,
});

type SortBy = "recent" | "title" | "author" | "added" | "progress";

function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortBy>("recent");
  const [tab, setTab] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");
  const inputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => setBooks(await listBooks()), []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const tags = useMemo(
    () => Array.from(new Set((books ?? []).flatMap((b) => b.tags))).sort(),
    [books],
  );

  const visible = useMemo(() => {
    let list = [...(books ?? [])];
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (b) => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q),
      );
    }
    if (tab === "reading") list = list.filter((b) => b.progress > 0 && !b.finished);
    if (tab === "finished") list = list.filter((b) => b.finished);
    if (tag) list = list.filter((b) => b.tags.includes(tag));
    const cmp: Record<SortBy, (a: BookMeta, b: BookMeta) => number> = {
      recent: (a, b) => b.lastOpenedAt - a.lastOpenedAt,
      added: (a, b) => b.addedAt - a.addedAt,
      title: (a, b) => a.title.localeCompare(b.title),
      author: (a, b) => a.author.localeCompare(b.author),
      progress: (a, b) => b.progress - a.progress,
    };
    return list.sort(cmp[sort]);
  }, [books, query, tab, tag, sort]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        const book = await importFile(file);
        if (book) ok++;
        else toast.error(`Formato não suportado: ${file.name}`);
      } catch {
        toast.error(`Não consegui abrir ${file.name}`);
      }
    }
    if (ok) toast.success(`${ok} livro(s) adicionado(s)`);
    await refresh();
  }

  const continueBook = visible.find((b) => b.progress > 0 && !b.finished);

  return (
    <AppShell
      title="Minha estante"
      actions={
        <Button size="sm" onClick={() => inputRef.current?.click()}>
          <Plus className="mr-1 h-4 w-4" /> Adicionar
        </Button>
      }
      subheader={
        <>
          <div className="mt-3 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título ou autor"
                className="pl-8"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortBy)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recentes</SelectItem>
                <SelectItem value="added">Adicionados</SelectItem>
                <SelectItem value="title">Título</SelectItem>
                <SelectItem value="author">Autor</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Tabs value={tab} onValueChange={setTab} className="flex-1">
              <TabsList className="w-full">
                <TabsTrigger value="all" className="flex-1">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="reading" className="flex-1">
                  Lendo
                </TabsTrigger>
                <TabsTrigger value="finished" className="flex-1">
                  Terminados
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView(view === "grid" ? "list" : "grid")}
            >
              {view === "grid" ? "Lista" : "Capas"}
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
              <button
                onClick={() => setTag(null)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                  tag === null
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                Todas as etiquetas
              </button>
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTag(t === tag ? null : t)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs ${
                    tag === t ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </>
      }
    >


      <input
        ref={inputRef}
        type="file"
        accept=".epub,.pdf,.txt,.md"
        multiple
        hidden
        onChange={(e) => {
          void handleFiles(e.target.files);
          e.target.value = "";
        }}
      />

      <main
        className="px-4 py-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          void handleFiles(e.dataTransfer.files);
        }}
      >
        {books === null ? (
          <p className="py-16 text-center text-sm text-muted-foreground">Carregando estante…</p>
        ) : books.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-3 text-center">
            <FolderPlus className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sua estante está vazia. Adicione arquivos EPUB, PDF ou TXT do aparelho.
            </p>
            <Button onClick={() => inputRef.current?.click()}>Escolher arquivos</Button>
          </div>
        ) : (
          <>
            {continueBook && tab === "all" && !query && (
              <button
                onClick={() => navigate({ to: "/reader/$id", params: { id: continueBook.id } })}
                className="mb-5 flex w-full items-center gap-3 rounded-xl border border-border bg-card p-3 text-left"
              >
                <Cover book={continueBook} className="h-20 w-14" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-wide text-primary">Continuar lendo</p>
                  <p className="truncate font-medium">{continueBook.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{continueBook.author}</p>
                  <ProgressBar value={continueBook.progress} />
                </div>
              </button>
            )}

            {view === "grid" ? (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {visible.map((book) => (
                  <div key={book.id} className="group relative">
                    <button
                      className="w-full text-left"
                      onClick={() => navigate({ to: "/reader/$id", params: { id: book.id } })}
                    >
                      <Cover book={book} className="aspect-[2/3] w-full" />
                      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug">
                        {book.title}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-muted-foreground">{book.author}</p>
                      <ProgressBar value={book.progress} />
                    </button>
                    <BookMenu book={book} onChange={refresh} />
                  </div>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {visible.map((book) => (
                  <li key={book.id} className="relative flex items-center gap-3 py-3">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      onClick={() => navigate({ to: "/reader/$id", params: { id: book.id } })}
                    >
                      <Cover book={book} className="h-16 w-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{book.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{book.author}</p>
                        <ProgressBar value={book.progress} />
                      </div>
                    </button>
                    <BookMenu book={book} onChange={refresh} inline />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </AppShell>
  );
}

function BookMenu({
  book,
  onChange,
  inline,
}: {
  book: BookMeta;
  onChange: () => Promise<void> | void;
  inline?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={
            inline
              ? "rounded-md p-2 text-muted-foreground"
              : "absolute right-1 top-1 rounded-md bg-background/70 p-1 text-muted-foreground backdrop-blur"
          }
          aria-label="Opções do livro"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={async () => {
            await updateBook(book.id, { finished: !book.finished });
            await onChange();
          }}
        >
          <Check className="mr-2 h-4 w-4" />
          {book.finished ? "Marcar como não lido" : "Marcar como terminado"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            const value = window.prompt("Etiquetas (separadas por vírgula)", book.tags.join(", "));
            if (value === null) return;
            await updateBook(book.id, {
              tags: value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            });
            await onChange();
          }}
        >
          <Tag className="mr-2 h-4 w-4" /> Etiquetas
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            await updateBook(book.id, { progress: 0, location: "", finished: false });
            await onChange();
            toast.success("Progresso reiniciado");
          }}
        >
          <BookOpen className="mr-2 h-4 w-4" /> Reiniciar progresso
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive"
          onClick={async () => {
            if (!window.confirm(`Remover "${book.title}" da estante?`)) return;
            await deleteBook(book.id);
            await onChange();
            toast.success("Livro removido");
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Remover
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
