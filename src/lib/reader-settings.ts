import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeId = "day" | "night" | "sepia" | "parchment" | "black" | "custom";

export interface ReaderTheme {
  id: ThemeId;
  name: string;
  bg: string;
  fg: string;
  accent: string;
  dark: boolean;
}

export const READER_THEMES: ReaderTheme[] = [
  { id: "day", name: "Dia", bg: "#ffffff", fg: "#1c1917", accent: "#b45309", dark: false },
  { id: "sepia", name: "Sépia", bg: "#f4ecd8", fg: "#4b3b2a", accent: "#8b5e34", dark: false },
  {
    id: "parchment",
    name: "Pergaminho",
    bg: "#e8dcc0",
    fg: "#3d3323",
    accent: "#7a5c2e",
    dark: false,
  },
  { id: "night", name: "Noite", bg: "#1b1d23", fg: "#c9c7c2", accent: "#d9a441", dark: true },
  { id: "black", name: "Preto puro", bg: "#000000", fg: "#a8a29e", accent: "#d9a441", dark: true },
];

export const FONT_FAMILIES = [
  { id: "serif", name: "Serifada", css: "Georgia, 'Times New Roman', serif" },
  { id: "sans", name: "Sem serifa", css: "'Segoe UI', Roboto, system-ui, sans-serif" },
  { id: "mono", name: "Monoespaçada", css: "ui-monospace, 'Courier New', monospace" },
  { id: "literata", name: "Literata", css: "Literata, Georgia, serif" },
];

export type PageMode = "paged" | "scroll";
export type TapAction =
  | "next"
  | "prev"
  | "menu"
  | "bookmark"
  | "autoscroll"
  | "theme"
  | "none";

export interface ReaderSettings {
  themeId: ThemeId;
  customBg: string;
  customFg: string;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  margin: number;
  align: "left" | "justify";
  bold: boolean;
  letterSpacing: number;
  pageMode: PageMode;
  animation: "slide" | "fade" | "none";
  brightness: number;
  fullscreen: boolean;
  keepAwake: boolean;
  orientationLock: "auto" | "portrait" | "landscape";
  autoScrollSpeed: number;
  showStatusBar: boolean;
  volumeKeys: boolean;
  swipeGesture: boolean;
  tapLeft: TapAction;
  tapCenter: TapAction;
  tapRight: TapAction;
  dailyGoalMinutes: number;
  set: (patch: Partial<ReaderSettings>) => void;
}

export const useReaderSettings = create<ReaderSettings>()(
  persist(
    (set) => ({
      themeId: "night",
      customBg: "#101418",
      customFg: "#d6d3d1",
      fontFamily: "serif",
      fontSize: 20,
      lineHeight: 1.6,
      margin: 24,
      align: "justify",
      bold: false,
      letterSpacing: 0,
      pageMode: "paged",
      animation: "slide",
      brightness: 1,
      fullscreen: false,
      keepAwake: true,
      orientationLock: "auto",
      autoScrollSpeed: 30,
      showStatusBar: true,
      volumeKeys: true,
      swipeGesture: true,
      tapLeft: "prev",
      tapCenter: "menu",
      tapRight: "next",
      dailyGoalMinutes: 30,
      set: (patch) => set(patch),
    }),
    { name: "moonlight-reader-settings" },
  ),
);

export function resolveTheme(s: ReaderSettings) {
  if (s.themeId === "custom") {
    return {
      id: "custom" as ThemeId,
      name: "Personalizado",
      bg: s.customBg,
      fg: s.customFg,
      accent: "#d9a441",
      dark: true,
    };
  }
  return READER_THEMES.find((t) => t.id === s.themeId) ?? READER_THEMES[0];
}

export function fontCss(id: string) {
  return FONT_FAMILIES.find((f) => f.id === id)?.css ?? FONT_FAMILIES[0].css;
}
