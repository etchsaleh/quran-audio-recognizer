import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/cn";
import { toArabicIndicDigits } from "@/lib/arabic";
import { splitVerseByPhrase, splitVerseIntoWords } from "@/lib/verse-text";
import { getJuz, isJuzStart } from "@/lib/juz";

/** Verses that contain a place of prostration (sajdah) – classic Quran symbol ۩ */
const SAJDAH_VERSES = new Set<string>([
  "7-206", "13-15", "16-50", "17-109", "19-58", "22-18", "25-60", "27-26",
  "32-15", "38-24", "41-38", "53-62", "84-21", "96-19",
]);
const SAJDAH_SYMBOL = "۩"; // U+06E9 Arabic place of sajdah

const DOUBLE_TAP_MS = 350;

export function Verse({
  surah,
  ayah,
  text,
  highlighted,
  highlightedPhrase,
  highlightedWordIndices,
  isBookmarked,
  onToggleBookmark,
  onTapVerse,
  isExpanded,
  meaning,
  meaningLoading,
}: {
  surah: number;
  ayah: number;
  text: string;
  highlighted: boolean;
  highlightedPhrase?: string | null;
  highlightedWordIndices?: number[] | null;
  isBookmarked?: boolean;
  onToggleBookmark?: (surah: number, ayah: number) => void;
  onTapVerse?: (surah: number, ayah: number) => void;
  isExpanded?: boolean;
  meaning?: string | null;
  meaningLoading?: boolean;
}) {
  const isSajdahVerse = SAJDAH_VERSES.has(`${surah}-${ayah}`);
  const textWithoutSajdah = isSajdahVerse ? text.replace(/\u06E9/g, "").trim() : text;
  const { before, phrase, after } = splitVerseByPhrase(textWithoutSajdah, highlighted && highlightedPhrase ? highlightedPhrase : null);
  const words = splitVerseIntoWords(textWithoutSajdah);
  const wordHighlightSet =
    highlighted && highlightedWordIndices?.length
      ? new Set(highlightedWordIndices)
      : null;
  const showJuzDivider = isJuzStart(surah, ayah);
  const juzNum = getJuz(surah, ayah);

  const showMeaning = onTapVerse != null;
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const articleClick = showMeaning ? undefined : (onToggleBookmark ? () => onToggleBookmark(surah, ayah) : undefined);
  const articleRole = showMeaning ? undefined : (onToggleBookmark ? "button" : undefined);

  const handleVerseTap = useCallback(() => {
    if (!onTapVerse) return;
    if (!onToggleBookmark) {
      onTapVerse(surah, ayah);
      return;
    }
    const now = Date.now();
    if (now - lastTapRef.current <= DOUBLE_TAP_MS) {
      if (singleTapTimerRef.current) {
        clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      lastTapRef.current = 0;
      onToggleBookmark(surah, ayah);
      return;
    }
    lastTapRef.current = now;
    singleTapTimerRef.current = setTimeout(() => {
      singleTapTimerRef.current = null;
      onTapVerse(surah, ayah);
    }, DOUBLE_TAP_MS);
  }, [surah, ayah, onTapVerse, onToggleBookmark]);

  useEffect(() => () => {
    if (singleTapTimerRef.current) clearTimeout(singleTapTimerRef.current);
  }, []);

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
        role={articleRole}
        tabIndex={articleRole ? 0 : undefined}
        onClick={articleClick}
        onKeyDown={
          articleRole && onToggleBookmark
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
          !showMeaning && onToggleBookmark && "cursor-pointer active:scale-[0.99]",
          highlighted && "verse-highlight",
          !highlighted && "border-white/10 bg-app-surface transition-colors duration-200",
          !highlighted && isBookmarked && "verse-bookmark bg-primary/20",
        )}
        aria-label={!showMeaning && onToggleBookmark ? (isBookmarked ? "Remove bookmark" : "Bookmark verse") : undefined}
      >
        <div className="flex items-start justify-between gap-3 flex-row-reverse">
          <div
            className={cn("flex-1 font-quran text-[22px] leading-[2.2] text-right min-w-0", showMeaning && "cursor-pointer active:opacity-90")}
            dir="rtl"
            lang="ar"
            style={{ color: highlighted ? "#D4B8F0" : "#ffffff" }}
            role={showMeaning ? "button" : undefined}
            tabIndex={showMeaning ? 0 : undefined}
            onClick={showMeaning ? (e) => { e.stopPropagation(); handleVerseTap(); } : undefined}
            onKeyDown={
              showMeaning
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleVerseTap();
                    }
                  }
                : undefined
            }
            aria-label={showMeaning ? "Tap for meaning, double-tap to bookmark" : undefined}
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
                {isSajdahVerse && (
                  <span className="sajdah-symbol" aria-label="Place of prostration">
                    {" "}{SAJDAH_SYMBOL}
                  </span>
                )}
              </>
            ) : phrase ? (
              <>
                {before}
                <span className="phrase-highlight">{phrase}</span>
                {after}
                {isSajdahVerse && (
                  <span className="sajdah-symbol" aria-label="Place of prostration">
                    {" "}{SAJDAH_SYMBOL}
                  </span>
                )}
              </>
            ) : (
              <>
                {textWithoutSajdah}
                {isSajdahVerse && (
                  <span className="sajdah-symbol" aria-label="Place of prostration">
                    {" "}{SAJDAH_SYMBOL}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex shrink-0 pt-1">
            <span
              className="verse-number-badge"
              aria-label={`Verse ${ayah}`}
            >
              {toArabicIndicDigits(ayah)}
            </span>
          </div>
        </div>
        {showMeaning && isExpanded && (
          <div
            className="verse-meaning mt-3 pt-3 border-t border-white/10 text-right text-sm text-white/90 leading-relaxed"
            dir="rtl"
            lang="ar"
          >
            {meaningLoading ? (
              <span className="text-white/50">جاري التحميل…</span>
            ) : meaning ? (
              <p>{meaning}</p>
            ) : (
              <span className="text-white/50">تعذر تحميل المعنى.</span>
            )}
          </div>
        )}
      </article>
    </div>
  );
}

