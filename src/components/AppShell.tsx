import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  BookMarked,
  BookOpen,
  FolderOpen,
  Library,
  Menu,
  Settings,
} from "lucide-react";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Minha estante", icon: Library, exact: true },
  { to: "/files", label: "Meus arquivos", icon: FolderOpen, exact: false },
  { to: "/library", label: "Biblioteca", icon: BookOpen, exact: false },
  { to: "/marks", label: "Marcadores", icon: BookMarked, exact: false },
  { to: "/stats", label: "Estatísticas", icon: BarChart3, exact: false },
  { to: "/settings", label: "Configurações", icon: Settings, exact: false },
] as const;

export function AppShell({
  title,
  actions,
  children,
  subheader,
}: {
  title: string;
  actions?: ReactNode;
  subheader?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-3 pb-2 pt-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              aria-label="Abrir menu"
              className="rounded-md p-2 text-foreground hover:bg-accent"
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center gap-2 border-b border-border px-5 py-5">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">teste</span>
              </div>
              <nav className="py-2">
                {NAV.map(({ to, label, icon: Icon, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setOpen(false)}
                    activeOptions={{ exact }}
                    className="flex items-center gap-3 px-5 py-3 text-sm text-muted-foreground hover:bg-accent"
                    activeProps={{
                      className:
                        "flex items-center gap-3 px-5 py-3 text-sm bg-accent text-primary font-medium",
                    }}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          <h1 className="flex-1 truncate text-lg font-semibold tracking-tight">{title}</h1>
          {actions}
        </div>
        {subheader}
      </header>
      {children}
    </div>
  );
}
