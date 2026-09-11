import { LogOut } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { userAvatar } from "@/lib/use-auth";

export function AccountCard() {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const { email, name, picture } = userAvatar(user);

  if (!user) return null;

  return (
    <section className="mt-6 border-t border-border pt-4">
      <h2 className="mb-3 text-sm font-medium">Conta</h2>
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
        {picture ? (
          <img
            src={picture}
            alt={`Foto de ${name || email}`}
            className="h-12 w-12 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-medium">
            {(name || email || "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {name && <p className="truncate text-sm font-medium">{name}</p>}
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await supabase.auth.signOut();
            toast.success("Você saiu da conta");
            setBusy(false);
          }}
        >
          <LogOut className="mr-1 h-4 w-4" />
          Sair
        </Button>
      </div>
    </section>
  );
}
