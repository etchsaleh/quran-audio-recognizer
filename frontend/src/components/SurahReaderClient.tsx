"use client";

import { StickyHeader } from "@/components/StickyHeader";
import { Verse } from "@/components/Verse";
import { SurahNav } from "@/components/SurahNav";
import { useHighlightVerse } from "@/hooks/useHighlightVerse";
import { useBookmarks } from "@/hooks/useBookmarks";
import type { SurahSummary } from "@/lib/api/types";

export function SurahReaderClient({
  surah,
  title,
  subtitle,
  verses,
  surahs,
}: {
  surah: number;
  title: string;
  subtitle?: string;
  verses: Array<{ ayah: number; text: string }>;
  surahs: SurahSummary[];
}) {
  const { highlightedAyah, matchedPhrase, matchedWordIndices } = useHighlightVerse(surah);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  return (
    <>
      <StickyHeader
        title={title}
        subtitle={subtitle}
        backHref="/surahs"
        rightSlot={<SurahNav surahs={surahs} currentSurah={surah} />}
      />

      <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-4 bg-app-bg">
        <div className="grid gap-3">
          {verses.map((v) => {
            const highlighted = highlightedAyah === v.ayah;
            return (
              <Verse
                key={v.ayah}
                surah={surah}
                ayah={v.ayah}
                text={v.text}
                highlighted={highlighted}
                highlightedPhrase={highlighted ? matchedPhrase ?? undefined : undefined}
                highlightedWordIndices={highlighted ? matchedWordIndices ?? undefined : undefined}
                isBookmarked={isBookmarked(surah, v.ayah)}
                onToggleBookmark={toggleBookmark}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
