import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SettingsPanel } from "@/components/reader/SettingsPanel";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useReaderSettings } from "@/lib/reader-settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Ajustes de leitura — teste" },
      {
        name: "description",
        content: "Temas, fontes, margens, gestos e rolagem automática do seu leitor.",
      },
      { property: "og:title", content: "Ajustes de leitura — teste" },
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
    <AppShell title="Ajustes">
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
            onValueChange={(vals) => s.set({ dailyGoalMinutes: vals[0] ?? 0 })}
          />
        </div>
      </main>
    </AppShell>
  );
}
