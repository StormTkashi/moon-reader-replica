import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type BookFormat = "epub" | "pdf" | "txt";

export interface BookMeta {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  cover?: string; // data url
  addedAt: number;
  lastOpenedAt: number;
  progress: number; // 0..1
  location: string; // epub cfi / pdf page / txt offset
  tags: string[];
  size: number;
  finished: boolean;
}

export interface Bookmark {
  id: string;
  bookId: string;
  location: string;
  label: string;
  createdAt: number;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface Highlight {
  id: string;
  bookId: string;
  location: string;
  text: string;
  note: string;
  color: HighlightColor;
  createdAt: number;
}

export interface ReadingSession {
  id: string;
  bookId: string;
  day: string; // yyyy-mm-dd
  seconds: number;
  pages: number;
}

interface ReaderDB extends DBSchema {
  books: { key: string; value: BookMeta };
  files: { key: string; value: { id: string; blob: Blob } };
  bookmarks: { key: string; value: Bookmark; indexes: { byBook: string } };
  highlights: { key: string; value: Highlight; indexes: { byBook: string } };
  sessions: { key: string; value: ReadingSession; indexes: { byDay: string } };
}

let dbPromise: Promise<IDBPDatabase<ReaderDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ReaderDB>("moonlight-reader", 1, {
      upgrade(db) {
        db.createObjectStore("books", { keyPath: "id" });
        db.createObjectStore("files", { keyPath: "id" });
        const bm = db.createObjectStore("bookmarks", { keyPath: "id" });
        bm.createIndex("byBook", "bookId");
        const hl = db.createObjectStore("highlights", { keyPath: "id" });
        hl.createIndex("byBook", "bookId");
        const se = db.createObjectStore("sessions", { keyPath: "id" });
        se.createIndex("byDay", "day");
      },
    });
  }
  return dbPromise;
}

export const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;

export async function listBooks(): Promise<BookMeta[]> {
  return (await getDB()).getAll("books");
}

export async function getBook(id: string) {
  return (await getDB()).get("books", id);
}

export async function saveBook(book: BookMeta) {
  await (await getDB()).put("books", book);
}

export async function updateBook(id: string, patch: Partial<BookMeta>) {
  const db = await getDB();
  const current = await db.get("books", id);
  if (!current) return;
  await db.put("books", { ...current, ...patch });
}

export async function deleteBook(id: string) {
  const db = await getDB();
  await db.delete("books", id);
  await db.delete("files", id);
  const bms = await db.getAllFromIndex("bookmarks", "byBook", id);
  const hls = await db.getAllFromIndex("highlights", "byBook", id);
  await Promise.all([
    ...bms.map((b) => db.delete("bookmarks", b.id)),
    ...hls.map((h) => db.delete("highlights", h.id)),
  ]);
}

export async function saveFile(id: string, blob: Blob) {
  await (await getDB()).put("files", { id, blob });
}

export async function getFile(id: string) {
  return (await (await getDB()).get("files", id))?.blob;
}

export async function listBookmarks(bookId: string) {
  return (await getDB()).getAllFromIndex("bookmarks", "byBook", bookId);
}

export async function addBookmark(b: Bookmark) {
  await (await getDB()).put("bookmarks", b);
}

export async function deleteBookmark(id: string) {
  await (await getDB()).delete("bookmarks", id);
}

export async function listHighlights(bookId: string) {
  return (await getDB()).getAllFromIndex("highlights", "byBook", bookId);
}

export async function saveHighlight(h: Highlight) {
  await (await getDB()).put("highlights", h);
}

export async function deleteHighlight(id: string) {
  await (await getDB()).delete("highlights", id);
}

export async function listSessions() {
  return (await getDB()).getAll("sessions");
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export async function addReadingTime(bookId: string, seconds: number, pages = 0) {
  if (seconds <= 0 && pages <= 0) return;
  const db = await getDB();
  const day = todayKey();
  const id = `${bookId}:${day}`;
  const current = await db.get("sessions", id);
  await db.put("sessions", {
    id,
    bookId,
    day,
    seconds: (current?.seconds ?? 0) + seconds,
    pages: (current?.pages ?? 0) + pages,
  });
}
