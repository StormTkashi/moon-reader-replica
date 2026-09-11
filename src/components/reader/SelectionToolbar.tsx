import { Bold, Copy, Highlighter, StickyNote, Underline } from "lucide-react";
import type { HighlightColor } from "@/lib/db";

export const HIGHLIGHT_COLORS: { id: HighlightColor; hex: string }[] = [
  { id: "yellow", hex: "#f2c14e" },
  { id: "green", hex: "#7bbf6a" },
  { id: "blue", hex: "#6aa7d8" },
  { id: "pink", hex: "#e08aa8" },
  { id: "purple", hex: "#a78bd8" },
];

export interface MarkStyle {
  color: HighlightColor;
  style: "highlight" | "underline";
  bold: boolean;
}

export function SelectionToolbar({
  rect,
  mark,
  onMarkChange,
  onCopy,
  onHighlight,
  onNote,
}: {
  rect: { top: number; left: number; width: number; height: number };
  mark: MarkStyle;
  onMarkChange: (m: MarkStyle) => void;
  onCopy: () => void;
  onHighlight: () => void;
  onNote: () => void;
}) {
  const top = Math.max(8, rect.top - 96);
  const left = Math.max(8, Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 296));

  return (
    <div
      className="absolute z-40 w-[280px] animate-scale-in rounded-xl border border-border bg-popover text-popover-foreground shadow-xl"
      style={{ top, left }}
    >
      {/* estilo da marcação */}
      <div className="flex items-center gap-1.5 border-b border-border px-2 py-2">
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            aria-label={`Cor ${c.id}`}
            onClick={() => onMarkChange({ ...mark, color: c.id })}
            className={`h-6 w-6 rounded-full border-2 ${
              mark.color === c.id ? "border-primary" : "border-transparent"
            }`}
            style={{ background: c.hex }}
          />
        ))}
        <span className="mx-1 h-5 w-px bg-border" />
        <button
          aria-label="Marcar em negrito"
          onClick={() => onMarkChange({ ...mark, bold: !mark.bold })}
          className={`rounded-md p-1.5 ${mark.bold ? "bg-accent text-accent-foreground" : ""}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          aria-label="Marca fina (sublinhado)"
          onClick={() =>
            onMarkChange({
              ...mark,
              style: mark.style === "underline" ? "highlight" : "underline",
            })
          }
          className={`rounded-md p-1.5 ${
            mark.style === "underline" ? "bg-accent text-accent-foreground" : ""
          }`}
        >
          <Underline className="h-4 w-4" />
        </button>
      </div>

      {/* ações */}
      <div className="grid grid-cols-3">
        <Action icon={<Copy className="h-4 w-4" />} label="Copiar" onClick={onCopy} />
        <Action icon={<Highlighter className="h-4 w-4" />} label="Realçar" onClick={onHighlight} />
        <Action icon={<StickyNote className="h-4 w-4" />} label="Nota" onClick={onNote} />
      </div>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-2 py-2.5 text-xs hover:bg-accent hover:text-accent-foreground"
    >
      {icon}
      {label}
    </button>
  );
}
