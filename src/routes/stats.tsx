import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { listBooks, listSessions, todayKey, type BookMeta, type ReadingSession } from "@/lib/db";
import { useReaderSettings } from "@/lib/reader-settings";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "Estatísticas de leitura — Lumen Reader" },
      {
        name: "description",
        content: "Tempo lido, sequência de dias, meta diária e livros terminados.",
      },
      { property: "og:title", content: "Estatísticas de leitura — Lumen Reader" },
      {
        property: "og:description",
        content: "Acompanhe seu tempo de leitura e a sua sequência de dias.",
      },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [books, setBooks] = useState<BookMeta[]>([]);
  const goal = useReaderSettings((s) => s.dailyGoalMinutes);

  useEffect(() => {
    void listSessions().then(setSessions);
    void listBooks().then(setBooks);
  }, []);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    sessions.forEach((s) => map.set(s.day, (map.get(s.day) ?? 0) + s.seconds));
    return map;
  }, [sessions]);

  const last14 = useMemo(() => {
    const days: { day: string; minutes: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = todayKey(d);
      days.push({ day: key, minutes: Math.round((byDay.get(key) ?? 0) / 60) });
    }
    return days;
  }, [byDay]);

  const streak = useMemo(() => {
    let count = 0;
    for (let i = 0; i < 400; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const seconds = byDay.get(todayKey(d)) ?? 0;
      if (seconds > 60) count++;
      else if (i > 0) break;
    }
    return count;
  }, [byDay]);

  const totalMinutes = Math.round(
    sessions.reduce((sum, s) => sum + s.seconds, 0) / 60,
  );
  const todayMinutes = Math.round((byDay.get(todayKey()) ?? 0) / 60);
  const max = Math.max(...last14.map((d) => d.minutes), goal, 1);

  return (
    <AppShell title="Estatísticas">
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <div className="grid grid-cols-2 gap-3">
          <Card label="Hoje" value={`${todayMinutes} min`} sub={`meta ${goal} min`} />
          <Card label="Sequência" value={`${streak} dia(s)`} sub="dias seguidos lendo" />
          <Card label="Tempo total" value={`${totalMinutes} min`} sub="desde o início" />
          <Card
            label="Terminados"
            value={String(books.filter((b) => b.finished).length)}
            sub={`de ${books.length} livros`}
          />
        </div>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">Últimos 14 dias</h2>
          <div className="mt-4 flex h-32 items-end gap-1.5">
            {last14.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-primary/80"
                  style={{ height: `${Math.max((d.minutes / max) * 100, 2)}%` }}
                  title={`${d.minutes} min`}
                />
                <span className="text-[9px] text-muted-foreground">{d.day.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-medium">Progresso dos livros</h2>
          <ul className="mt-3 space-y-2">
            {books.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum livro na estante ainda.</li>
            )}
            {books
              .slice()
              .sort((a, b) => b.progress - a.progress)
              .map((b) => (
                <li key={b.id}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate pr-2">{b.title}</span>
                    <span className="text-muted-foreground">
                      {Math.round(b.progress * 100)}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.round(b.progress * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </section>
      </main>
    </AppShell>
  );
}

function Card({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
