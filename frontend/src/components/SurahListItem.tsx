import Link from "next/link";
import { cn } from "@/lib/cn";

export function SurahListItem({
  surah,
  name,
  transliteration,
  totalVerses,
  dark = false,
}: {
  surah: number;
  name: string;
  transliteration: string | null;
  totalVerses: number;
  dark?: boolean;
}) {
  return (
    <Link
      href={`/surah/${surah}`}
      className={cn(
        "group flex items-center justify-between rounded-2xl px-5 py-4 min-h-[56px] transition-all duration-300 active:scale-[0.99]",
        dark
          ? "bg-white/8 border border-white/10 text-white hover:bg-white/12"
          : "border border-sand-200 bg-white text-ink-950 shadow-soft",
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-base font-semibold",
            dark ? "bg-white/15 text-white" : "bg-teal-500/12 text-teal-600",
          )}
        >
          {surah}
        </div>
        <div className="min-w-0">
          <div
            className={cn(
              "truncate text-[15px] font-semibold",
              dark ? "text-white" : "text-ink-950",
            )}
          >
            {transliteration ?? `Surah ${surah}`}
          </div>
          <div
            className={cn(
              "mt-0.5 flex items-center gap-2 text-[13px]",
              dark ? "text-white/60" : "text-ink-700",
            )}
          >
            <span className="truncate" dir="rtl">
              {name}
            </span>
            <span className={dark ? "text-white/40" : "text-sand-200"}>•</span>
            <span>{totalVerses} verses</span>
          </div>
        </div>
      </div>
      <div
        className={cn(
          "transition-colors",
          dark ? "text-white/50 group-hover:text-white" : "text-ink-700 group-hover:text-ink-950",
        )}
        aria-hidden="true"
      >
        →
      </div>
    </Link>
  );
}

