import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Login1 } from "@/components/ui/login-1";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/use-auth";

export function AuthGate({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Carregando…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <Login1
        loading={busy}
        onGoogle={async () => {
          setBusy(true);
          const result = await lovable.auth.signInWithOAuth("google", {
            redirect_uri: window.location.origin,
          });
          if (result.error) {
            setBusy(false);
            toast.error("Não foi possível entrar com o Google");
            return;
          }
          if (result.redirected) return;
          setBusy(false);
        }}
      />
    );
  }

  return <>{children}</>;
}
