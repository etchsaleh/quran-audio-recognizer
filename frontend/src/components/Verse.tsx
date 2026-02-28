import { cn } from "@/lib/cn";
import { toArabicIndicDigits } from "@/lib/arabic";
import { splitVerseByPhrase } from "@/lib/verse-text";

export function Verse({
  surah,
  ayah,
  text,
  highlighted,
  highlightedPhrase,
}: {
  surah: number;
  ayah: number;
  text: string;
  highlighted: boolean;
  highlightedPhrase?: string | null;
}) {
  const { before, phrase, after } = splitVerseByPhrase(text, highlighted && highlightedPhrase ? highlightedPhrase : null);

  return (
    <article
      id={`verse-${surah}-${ayah}`}
      className={cn(
        "rounded-2xl border px-4 py-4",
        highlighted ? "verse-highlight" : "border-white/10 bg-app-surface transition-colors duration-200",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex-1 font-quran text-[22px] leading-[2.2]"
          dir="rtl"
          lang="ar"
          style={{
            color: highlighted ? "#D4B8F0" : "#ffffff",
          }}
        >
          {phrase ? (
            <>
              {before}
              <span className="phrase-highlight">{phrase}</span>
              {after}
            </>
          ) : (
            text
          )}
        </div>
        <div className="shrink-0 pt-1">
          <span
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80"
            aria-label={`Verse ${ayah}`}
          >
            {toArabicIndicDigits(ayah)}
          </span>
        </div>
      </div>
    </article>
  );
}

