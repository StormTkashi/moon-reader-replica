import { createFileRoute } from "@tanstack/react-router";
import { Hammer } from "lucide-react";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Biblioteca — teste" },
      {
        name: "description",
        content: "Catálogo de livros online do teste, em desenvolvimento.",
      },
      { property: "og:title", content: "Biblioteca — teste" },
      {
        property: "og:description",
        content: "Em breve: baixe livros direto pela biblioteca do teste.",
      },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <AppShell title="Biblioteca">
      <main className="mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-24 text-center">
        <Hammer className="h-12 w-12 text-primary" />
        <h2 className="text-lg font-semibold">Em desenvolvimento</h2>
        <p className="text-sm text-muted-foreground">
          Aqui você vai poder procurar e baixar livros direto pelo aplicativo. Por enquanto, use
          Meus arquivos para importar os seus.
        </p>
      </main>
    </AppShell>
  );
}
