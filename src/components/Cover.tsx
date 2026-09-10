import { FileText } from "lucide-react";

import type { BookMeta } from "@/lib/db";

export function Cover({ book, className }: { book: BookMeta; className?: string }) {
  if (book.cover) {
    return (
      <img
        src={book.cover}
        alt={`Capa de ${book.title}`}
        loading="lazy"
        className={`rounded-md object-cover shadow-md ${className ?? ""}`}
      />
    );
  }
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1 rounded-md bg-secondary p-2 text-center shadow-md ${className ?? ""}`}
    >
      <FileText className="h-5 w-5 text-muted-foreground" />
      <span className="text-[10px] uppercase text-muted-foreground">{book.format}</span>
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${Math.min(Math.round(value * 100), 100)}%` }}
      />
    </div>
  );
}
