const MEANING_API = "https://api.alquran.cloud/v1/ayah";
/** Arabic tafsir (التفسير الميسر) – brief explanation and word meanings */
const EDITION = "ar.muyassar";

const cache = new Map<string, string>();

export async function fetchVerseMeaning(
  surah: number,
  ayah: number,
  signal?: AbortSignal
): Promise<string> {
  const key = `${surah}:${ayah}`;
  const cached = cache.get(key);
  if (cached != null) return cached;

  const res = await fetch(`${MEANING_API}/${surah}:${ayah}/${EDITION}`, { signal });
  if (!res.ok) throw new Error("Could not load verse meaning");

  const json = (await res.json()) as {
    data?: { text?: string };
  };
  const text = json?.data?.text?.trim();
  if (!text) throw new Error("No meaning for this verse");

  cache.set(key, text);
  return text;
}
