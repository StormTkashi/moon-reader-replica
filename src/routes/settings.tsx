import { createFileRoute } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { SettingsPanel } from "@/components/reader/SettingsPanel";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useReaderSettings } from "@/lib/reader-settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes de leitura — Lumen Reader" },
      {
        name: "description",
        content: "Temas, fontes, margens, gestos e rolagem automática do seu leitor.",
      },
      { property: "og:title", content: "Ajustes de leitura — Lumen Reader" },
      {
        property: "og:description",
        content: "Personalize temas, tipografia e gestos de leitura.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const s = useReaderSettings();
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="border-b border-border px-4 py-4">
        <h1 className="text-xl font-semibold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">
          Valem para todos os livros da sua estante.
        </p>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4">
        <SettingsPanel />
        <div className="mt-6 border-t border-border pt-4">
          <Label className="text-sm font-normal text-muted-foreground">
            Meta diária de leitura: {s.dailyGoalMinutes} min
          </Label>
          <Slider
            className="mt-3"
            min={5}
            max={180}
            step={5}
            value={[s.dailyGoalMinutes]}
            onValueChange={([v]) => s.set({ dailyGoalMinutes: v })}
          />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
