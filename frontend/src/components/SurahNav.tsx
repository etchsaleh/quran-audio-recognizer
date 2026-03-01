"use client";

import Link from "next/link";
import type { SurahSummary } from "@/lib/api/types";

export function SurahNav({
  surahs,
  currentSurah,
}: {
  surahs: SurahSummary[];
  currentSurah: number;
}) {
  const prev = currentSurah > 1 ? currentSurah - 1 : null;
  const next = currentSurah < 114 ? currentSurah + 1 : null;

  return (
    <div className="flex shrink-0 items-center gap-1">
      {prev ? (
        <Link
          href={`/surah/${prev}`}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-app-surface text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={`Previous surah: ${surahs.find((s) => s.surah === prev)?.transliteration ?? prev}`}
        >
          <span className="text-lg leading-none">‹</span>
        </Link>
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/5 bg-app-surface/50 text-white/30 cursor-default" aria-hidden>
          ‹
        </span>
      )}
      {next ? (
        <Link
          href={`/surah/${next}`}
          className="grid h-9 w-9 place-items-center rounded-xl border border-white/15 bg-app-surface text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          aria-label={`Next surah: ${surahs.find((s) => s.surah === next)?.transliteration ?? next}`}
        >
          <span className="text-lg leading-none">›</span>
        </Link>
      ) : (
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/5 bg-app-surface/50 text-white/30 cursor-default" aria-hidden>
          ›
        </span>
      )}
    </div>
  );
}
