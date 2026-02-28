const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicIndicDigits(n: number): string {
  return String(n)
    .split("")
    .map((ch) => (ch >= "0" && ch <= "9" ? ARABIC_INDIC[ch.charCodeAt(0) - 48] : ch))
    .join("");
}

