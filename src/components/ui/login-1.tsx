import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";

interface Login1Props {
  heading?: string;
  subheading?: string;
  appName?: string;
  googleText?: string;
  loading?: boolean;
  onGoogle: () => void;
}

const Login1 = ({
  heading = "Entrar",
  subheading = "Conecte sua conta Google para começar a ler.",
  appName = "teste",
  googleText = "Continuar com Google",
  loading = false,
  onGoogle,
}: Login1Props) => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-2xl">
            📖
          </div>
          <p className="text-lg font-semibold tracking-tight">{appName}</p>
          <h1 className="text-xl font-semibold">{heading}</h1>
          <p className="text-center text-sm text-muted-foreground">{subheading}</p>
        </div>

        <div className="mt-8 rounded-xl border border-border bg-card p-5">
          <Button
            variant="outline"
            className="w-full gap-2"
            disabled={loading}
            onClick={onGoogle}
          >
            <FcGoogle className="h-5 w-5" />
            {loading ? "Conectando…" : googleText}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Usamos sua conta Google apenas para identificar você e guardar suas leituras.
          </p>
        </div>
      </div>
    </section>
  );
};

export { Login1 };
