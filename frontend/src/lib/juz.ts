/**
 * Standard Hafs Juz boundaries. Each entry is where that Juz starts (surah, ayah).
 */
const JUZ_STARTS: Array<{ juz: number; surah: number; ayah: number }> = [
  { juz: 1, surah: 1, ayah: 1 },
  { juz: 2, surah: 2, ayah: 142 },
  { juz: 3, surah: 2, ayah: 253 },
  { juz: 4, surah: 3, ayah: 93 },
  { juz: 5, surah: 4, ayah: 24 },
  { juz: 6, surah: 4, ayah: 148 },
  { juz: 7, surah: 5, ayah: 82 },
  { juz: 8, surah: 6, ayah: 1 },
  { juz: 9, surah: 6, ayah: 111 },
  { juz: 10, surah: 7, ayah: 88 },
  { juz: 11, surah: 8, ayah: 41 },
  { juz: 12, surah: 9, ayah: 93 },
  { juz: 13, surah: 11, ayah: 1 },
  { juz: 14, surah: 15, ayah: 1 },
  { juz: 15, surah: 17, ayah: 1 },
  { juz: 16, surah: 18, ayah: 75 },
  { juz: 17, surah: 21, ayah: 1 },
  { juz: 18, surah: 23, ayah: 1 },
  { juz: 19, surah: 25, ayah: 21 },
  { juz: 20, surah: 27, ayah: 1 },
  { juz: 21, surah: 29, ayah: 1 },
  { juz: 22, surah: 33, ayah: 1 },
  { juz: 23, surah: 36, ayah: 1 },
  { juz: 24, surah: 39, ayah: 1 },
  { juz: 25, surah: 41, ayah: 1 },
  { juz: 26, surah: 46, ayah: 1 },
  { juz: 27, surah: 51, ayah: 1 },
  { juz: 28, surah: 58, ayah: 1 },
  { juz: 29, surah: 67, ayah: 1 },
  { juz: 30, surah: 78, ayah: 1 },
];

function compare(surah: number, ayah: number, s: number, a: number): number {
  if (surah !== s) return surah - s;
  return ayah - a;
}

/** Returns the Juz number (1–30) for the given surah and ayah. */
export function getJuz(surah: number, ayah: number): number {
  let j = 1;
  for (const start of JUZ_STARTS) {
    if (compare(surah, ayah, start.surah, start.ayah) >= 0) {
      j = start.juz;
    }
  }
  return j;
}

/** True if this verse is the first verse of a Juz (show Juz divider before it). */
export function isJuzStart(surah: number, ayah: number): boolean {
  return JUZ_STARTS.some((s) => s.surah === surah && s.ayah === ayah);
}
