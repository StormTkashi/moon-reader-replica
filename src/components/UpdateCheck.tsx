import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Download, Loader2, RefreshCw } from "lucide-react";

const APP_VERSION = "1.0.0";
const REPO = "lumen-reader/app";

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "current" }
  | { kind: "available"; version: string; url: string }
  | { kind: "error"; message: string };

export function UpdateCheck() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function check() {
    setStatus({ kind: "checking" });
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { tag_name?: string; html_url?: string };
      const tag = (data.tag_name ?? "").replace(/^v/, "");
      if (tag && tag !== APP_VERSION) {
        setStatus({ kind: "available", version: tag, url: data.html_url ?? "" });
      } else {
        setStatus({ kind: "current" });
      }
    } catch {
      setStatus({ kind: "current" });
    }
  }

  return (
    <div className="mt-6 border-t border-border pt-4 pb-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Atualizações</p>
          <p className="text-xs text-muted-foreground">Versão atual {APP_VERSION}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={check}
          disabled={status.kind === "checking"}
        >
          {status.kind === "checking" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Verificar atualização
        </Button>
      </div>

      {status.kind === "current" && (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" />
          Você já está na versão mais recente.
        </p>
      )}

      {status.kind === "available" && (
        <a
          href={status.url}
          target="_blank"
          rel="noreferrer"
          className="mt-3 flex items-center gap-2 text-sm text-primary underline-offset-4 hover:underline"
        >
          <Download className="size-4" />
          Nova versão {status.version} disponível
        </a>
      )}
    </div>
  );
}
