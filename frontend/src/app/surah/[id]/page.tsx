import { api } from "@/lib/api/client";
import { SurahReaderClient } from "@/components/SurahReaderClient";

export const dynamic = "force-dynamic";

export default async function SurahPage({ params }: { params: { id: string } }) {
  const surahId = Number(params.id);
  const [s, surahs] = await Promise.all([api.getSurah(surahId), api.getSurahs()]);
  const title = s.transliteration ?? `Surah ${s.surah}`;
  const subtitle = `${s.name} • ${s.total_verses} verses`;

  return (
    <SurahReaderClient
      surah={s.surah}
      title={title}
      subtitle={subtitle}
      verses={s.verses}
      surahs={surahs}
    />
  );
}

