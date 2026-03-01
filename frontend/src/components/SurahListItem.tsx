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
          ? "bg-app-surface border border-white/10 text-white hover:bg-white/10"
          : "border border-sand-200 bg-white text-ink-950 shadow-soft",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="min-w-0 flex-1">
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
            <span className="truncate font-quran" dir="rtl" lang="ar">
              {name}
            </span>
            <span className={dark ? "text-white/40" : "text-sand-200"}>•</span>
            <span>{totalVerses} verses</span>
          </div>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 transition-colors",
          dark ? "text-white/50 group-hover:text-white" : "text-ink-700 group-hover:text-ink-950",
        )}
        aria-hidden="true"
      >
        →
      </span>
    </Link>
  );
}

