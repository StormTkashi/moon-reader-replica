export interface TocItem {
  label: string;
  href: string;
  depth: number;
}

export interface SearchHit {
  label: string;
  href: string;
  excerpt: string;
}

export interface ViewHandle {
  next: () => void;
  prev: () => void;
  goTo: (href: string) => void;
  goToPercent?: (pct: number) => void;
  search: (query: string) => Promise<SearchHit[]>;
  currentLocation: () => string;
  scrollBy?: (px: number) => void;
  selection?: () => { text: string; location: string } | null;
}

export interface ViewProps {
  blob: Blob;
  initialLocation: string;
  onProgress: (progress: number, location: string, pageLabel: string) => void;
  onToc: (toc: TocItem[]) => void;
  onTap: (zone: "left" | "center" | "right") => void;
}
