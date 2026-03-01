"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "quran-bookmarks";

export type Bookmark = { surah: number; ayah: number };

function loadBookmarks(): Bookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is Bookmark =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as Bookmark).surah === "number" &&
        typeof (x as Bookmark).ayah === "number",
    );
  } catch {
    return [];
  }
}

function saveBookmarks(list: Bookmark[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  useEffect(() => {
    setBookmarks(loadBookmarks());
    const handler = () => setBookmarks(loadBookmarks());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const isBookmarked = useCallback(
    (surah: number, ayah: number) =>
      bookmarks.some((b) => b.surah === surah && b.ayah === ayah),
    [bookmarks],
  );

  const toggleBookmark = useCallback((surah: number, ayah: number) => {
    setBookmarks((prev) => {
      const next = prev.some((b) => b.surah === surah && b.ayah === ayah)
        ? prev.filter((b) => !(b.surah === surah && b.ayah === ayah))
        : [...prev, { surah, ayah }];
      saveBookmarks(next);
      return next;
    });
  }, []);

  return { bookmarks, isBookmarked, toggleBookmark };
}
