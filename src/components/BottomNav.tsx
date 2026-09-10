import { Link } from "@tanstack/react-router";
import { BarChart3, Library, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Estante", icon: Library },
  { to: "/stats", label: "Estatísticas", icon: BarChart3 },
  { to: "/settings", label: "Ajustes", icon: Settings },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl">
        {items.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
            activeProps={{ className: "text-primary" }}
            activeOptions={{ exact: to === "/" }}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
