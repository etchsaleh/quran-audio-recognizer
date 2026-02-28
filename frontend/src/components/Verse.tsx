import { cn } from "@/lib/cn";
import { toArabicIndicDigits } from "@/lib/arabic";

export function Verse({
  surah,
  ayah,
  text,
  highlighted,
}: {
  surah: number;
  ayah: number;
  text: string;
  highlighted: boolean;
}) {
  return (
    <article
      id={`verse-${surah}-${ayah}`}
      className={cn(
        "rounded-2xl border border-white/10 bg-white/8 px-4 py-4 transition-all duration-300",
        highlighted ? "animate-highlight border-teal-400/40 bg-teal-400/15" : "",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="flex-1 text-[20px] leading-[2.15] text-white"
          dir="rtl"
          lang="ar"
          style={{ fontVariationSettings: '"wght" 450' }}
        >
          {text}
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

