export type SurahSummary = {
  surah: number;
  name: string;
  transliteration: string | null;
  type: string | null;
  total_verses: number;
};

export type Verse = {
  ayah: number;
  text: string;
};

export type Surah = SurahSummary & {
  verses: Verse[];
};

export type RecognizeResponse = {
  surah: number;
  ayah: number;
  confidence: number;
};

