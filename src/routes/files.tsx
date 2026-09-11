import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { FolderPlus, Upload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

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
  }

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
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }}
          className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card/50 px-6 py-14 text-center"
        >
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="text-base font-medium">Importar livros</p>
            <p className="text-sm text-muted-foreground">
              Escolha arquivos EPUB, PDF ou TXT do aparelho, ou arraste até aqui.
            </p>
          </div>
          <Button disabled={busy} onClick={() => inputRef.current?.click()}>
            <FolderPlus className="mr-2 h-4 w-4" />
            {busy ? "Importando…" : "Escolher arquivos"}
          </Button>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Os livros importados vão direto para a sua estante.
        </p>
      </main>
    </AppShell>
  );
}
