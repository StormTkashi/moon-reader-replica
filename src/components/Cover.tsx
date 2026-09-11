import { FileText, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { updateBook, type BookMeta } from "@/lib/db";
import { imageFileToCover } from "@/lib/import-book";

/** Capa com botão "+" quando o livro não tem foto, para escolher uma imagem manualmente. */
export function CoverPicker({
  book,
  className,
  onChange,
}: {
  book: BookMeta;
  className?: string;
  onChange?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="relative">
      <Cover book={book} {...(className ? { className } : {})} />
      {!book.cover && (
        <>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Adicionar capa de ${book.title}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!busy) inputRef.current?.click();
            }}
            className="absolute inset-0 flex items-center justify-center rounded-md bg-background/45 transition hover:bg-background/60"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Plus className="h-5 w-5" />
            </span>
          </span>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setBusy(true);
              try {
                const cover = await imageFileToCover(file);
                await updateBook(book.id, { cover });
                toast.success("Capa adicionada");
                onChange?.();
              } catch {
                toast.error("Não foi possível usar essa imagem");
              } finally {
                setBusy(false);
              }
            }}
          />
        </>
      )}
    </div>
  );
}

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
