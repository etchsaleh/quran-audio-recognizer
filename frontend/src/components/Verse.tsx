import { cn } from "@/lib/cn";
import { toArabicIndicDigits } from "@/lib/arabic";
import { splitVerseByPhrase, splitVerseIntoWords } from "@/lib/verse-text";
import { getJuz, isJuzStart } from "@/lib/juz";

export function Verse({
  surah,
  ayah,
  text,
  highlighted,
  highlightedPhrase,
  highlightedWordIndices,
  isBookmarked,
  onToggleBookmark,
}: {
  surah: number;
  ayah: number;
  text: string;
  highlighted: boolean;
  highlightedPhrase?: string | null;
  highlightedWordIndices?: number[] | null;
  isBookmarked?: boolean;
  onToggleBookmark?: (surah: number, ayah: number) => void;
}) {
  const { before, phrase, after } = splitVerseByPhrase(text, highlighted && highlightedPhrase ? highlightedPhrase : null);
  const words = splitVerseIntoWords(text);
  const wordHighlightSet =
    highlighted && highlightedWordIndices?.length
      ? new Set(highlightedWordIndices)
      : null;
  const showJuzDivider = isJuzStart(surah, ayah);
  const juzNum = getJuz(surah, ayah);

  return (
    <div className="grid gap-2">
      {showJuzDivider && (
        <div
          className="flex items-center gap-3 py-2"
          role="separator"
          aria-label={`Juz ${juzNum}`}
        >
          <div className="h-px flex-1 bg-white/20" />
          <span className="rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary-light">
            Juz {juzNum}
          </span>
          <div className="h-px flex-1 bg-white/20" />
        </div>
      )}
      <article
        id={`verse-${surah}-${ayah}`}
        role={onToggleBookmark ? "button" : undefined}
        tabIndex={onToggleBookmark ? 0 : undefined}
        onClick={onToggleBookmark ? () => onToggleBookmark(surah, ayah) : undefined}
        onKeyDown={
          onToggleBookmark
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onToggleBookmark(surah, ayah);
                }
              }
            : undefined
        }
        className={cn(
          "rounded-2xl border px-4 py-4 text-right cursor-default",
          onToggleBookmark && "cursor-pointer active:scale-[0.99]",
          highlighted && "verse-highlight",
          !highlighted && "border-white/10 bg-app-surface transition-colors duration-200",
          !highlighted && isBookmarked && "verse-bookmark bg-primary/20 font-semibold",
        )}
        aria-label={onToggleBookmark ? (isBookmarked ? "Remove bookmark" : "Bookmark verse") : undefined}
      >
        <div className="flex items-start justify-between gap-3 flex-row-reverse">
          <div
            className="flex-1 font-quran text-[22px] leading-[2.2] text-right"
            dir="rtl"
            lang="ar"
            style={{
              color: highlighted ? "#D4B8F0" : "#ffffff",
            }}
          >
            {wordHighlightSet && words.length > 0 ? (
              <>
                {words.map((w, i) => (
                  <span
                    key={`${i}-${w}`}
                    className={wordHighlightSet.has(i) ? "word-highlight" : undefined}
                  >
                    {w}{" "}
                  </span>
                ))}
              </>
            ) : phrase ? (
              <>
                {before}
                <span className="phrase-highlight">{phrase}</span>
                {after}
              </>
            ) : (
              text
            )}
          </div>
          <div className="flex shrink-0 pt-1">
            <span
              className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80"
              aria-label={`Verse ${ayah}`}
            >
              {toArabicIndicDigits(ayah)}
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}

