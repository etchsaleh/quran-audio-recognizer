"use client";

import Link from "next/link";
import { useBookmarks } from "@/hooks/useBookmarks";
import { toArabicIndicDigits } from "@/lib/arabic";

export default function BookmarksPage() {
  const { bookmarks } = useBookmarks();

  return (
    <main className="mx-auto w-full max-w-xl min-h-full flex flex-col bg-app-bg">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-app-bg/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-app-surface text-white transition-[transform,background] duration-300 active:scale-95 active:bg-white/10"
            aria-label="Back"
          >
            <span className="text-lg leading-none">←</span>
          </Link>
          <h1 className="text-lg font-semibold text-white tracking-tight">Bookmarks</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-safe-b">
        {bookmarks.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-app-surface px-5 py-8 text-center">
            <p className="text-white/70 text-[15px]">No bookmarks yet.</p>
            <p className="mt-1 text-white/50 text-sm">Open a surah and tap a verse to bookmark it.</p>
            <Link
              href="/surahs"
              className="mt-4 inline-block rounded-xl bg-primary/20 text-primary-light px-4 py-2 text-sm font-semibold"
            >
              Browse Surahs
            </Link>
          </div>
        ) : (
          <div className="grid gap-2">
            {bookmarks.map((b) => (
              <Link
                key={`${b.surah}-${b.ayah}`}
                href={`/surah/${b.surah}?ayah=${b.ayah}`}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-app-surface px-5 py-4 transition-colors hover:bg-white/5 active:scale-[0.99]"
              >
                <span className="font-semibold text-white">Surah {b.surah}</span>
                <span className="text-white/80 font-quran" dir="rtl">
                  آية {toArabicIndicDigits(b.ayah)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
