import Link from "next/link";
import { api } from "@/lib/api/client";
import { SurahListItem } from "@/components/SurahListItem";

export const dynamic = "force-dynamic";

export default async function SurahsPage() {
  const surahs = await api.getSurahs();

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
          <h1 className="text-lg font-semibold text-white tracking-tight">Surahs</h1>
        </div>
      </header>

      <div className="flex-1 px-4 py-4 pb-safe-b">
        <div className="grid gap-2">
          {surahs.map((s) => (
            <SurahListItem
              key={s.surah}
              surah={s.surah}
              name={s.name}
              transliteration={s.transliteration}
              totalVerses={s.total_verses}
              dark
            />
          ))}
        </div>
      </div>
    </main>
  );
}
