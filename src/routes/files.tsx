import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { FolderPlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Cover } from "@/components/Cover";
import { Button } from "@/components/ui/button";
import { deleteBook, listBooks, type BookMeta } from "@/lib/db";
import { importFile } from "@/lib/import-book";

export const Route = createFileRoute("/files")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Meus arquivos — teste" },
      {
        name: "description",
        content: "Importe arquivos EPUB, PDF e TXT do aparelho para sua estante.",
      },
      { property: "og:title", content: "Meus arquivos — teste" },
      {
        property: "og:description",
        content: "Adicione livros do aparelho ao teste em poucos toques.",
      },
    ],
  }),
  component: FilesPage,
});

function FilesPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [books, setBooks] = useState<BookMeta[] | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => setBooks(await listBooks()), []);
  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
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
    setBusy(false);
    if (ok) toast.success(`${ok} arquivo(s) importado(s)`);
    await refresh();
  }

  const sorted = [...(books ?? [])].sort((a, b) => b.addedAt - a.addedAt);

  return (
    <AppShell title="Meus arquivos">
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
      <main className="mx-auto max-w-2xl px-4 py-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center"
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Escolha arquivos EPUB, PDF ou TXT do aparelho, ou arraste até aqui.
          </p>
          <Button disabled={busy} onClick={() => inputRef.current?.click()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            {busy ? "Importando…" : "Escolher arquivos"}
          </Button>
        </div>

        <h2 className="mb-2 mt-6 text-sm font-medium text-muted-foreground">
          Arquivos importados ({sorted.length})
        </h2>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum arquivo importado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((book) => (
              <li key={book.id} className="flex items-center gap-3 py-3">
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  onClick={() => navigate({ to: "/reader/$id", params: { id: book.id } })}
                >
                  <Cover book={book} className="h-14 w-10" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{book.title}</p>
                    <p className="truncate text-xs uppercase text-muted-foreground">
                      {book.format} · {new Date(book.addedAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </button>
                <button
                  aria-label={`Remover ${book.title}`}
                  className="rounded-md p-2 text-destructive"
                  onClick={async () => {
                    if (!window.confirm(`Remover "${book.title}"?`)) return;
                    await deleteBook(book.id);
                    await refresh();
                    toast.success("Arquivo removido");
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
