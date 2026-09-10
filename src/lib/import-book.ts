import { saveBook, saveFile, uid, type BookFormat, type BookMeta } from "./db";

export function detectFormat(name: string): BookFormat | null {
  const n = name.toLowerCase();
  if (n.endsWith(".epub")) return "epub";
  if (n.endsWith(".pdf")) return "pdf";
  if (n.endsWith(".txt") || n.endsWith(".md")) return "txt";
  return null;
}

async function epubMeta(file: File) {
  const ePub = (await import("epubjs")).default;
  const book = ePub(await file.arrayBuffer());
  await book.ready;
  const md = (book.packaging?.metadata ?? {}) as { title?: string; creator?: string };
  let cover: string | undefined;
  try {
    const url = await book.coverUrl();
    if (url) {
      const blob = await (await fetch(url)).blob();
      cover = await blobToDataUrl(blob);
    }
  } catch {
    cover = undefined;
  }
  book.destroy();
  return { title: md.title, author: md.creator, cover };
}

async function pdfMeta(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const info = (await doc.getMetadata()).info as { Title?: string; Author?: string };
  let cover: string | undefined;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.6 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    cover = canvas.toDataURL("image/jpeg", 0.7);
  } catch {
    cover = undefined;
  }
  await (doc as unknown as { destroy?: () => Promise<void> }).destroy?.();
  return { title: info?.Title, author: info?.Author, cover };
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}

export async function importFile(file: File): Promise<BookMeta | null> {
  const format = detectFormat(file.name);
  if (!format) return null;
  const fallbackTitle = file.name.replace(/\.[^.]+$/, "");
  let title = fallbackTitle;
  let author = "Desconhecido";
  let cover: string | undefined;

  try {
    if (format === "epub") {
      const m = await epubMeta(file);
      title = m.title?.trim() || fallbackTitle;
      author = m.author?.trim() || author;
      cover = m.cover;
    } else if (format === "pdf") {
      const m = await pdfMeta(file);
      title = m.title?.trim() || fallbackTitle;
      author = m.author?.trim() || author;
      cover = m.cover;
    }
  } catch {
    /* metadados opcionais */
  }

  const book: BookMeta = {
    id: uid(),
    title,
    author,
    format,
    ...(cover ? { cover } : {}),
    addedAt: Date.now(),
    lastOpenedAt: 0,
    progress: 0,
    location: "",
    tags: [],
    size: file.size,
    finished: false,
  };
  await saveFile(book.id, file);
  await saveBook(book);
  return book;
}
