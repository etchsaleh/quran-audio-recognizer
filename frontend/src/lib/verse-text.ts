/**
 * Split verse text into [before, phrase, after] when phrase is found.
 * Handles different whitespace between verse and phrase.
 */
export function splitVerseByPhrase(
  text: string,
  phrase: string | null | undefined
): { before: string; phrase: string | null; after: string } {
  if (!phrase || !phrase.trim()) return { before: text, phrase: null, after: "" };

  const p = phrase.trim();

  // Exact match
  const idx = text.indexOf(p);
  if (idx >= 0) {
    return { before: text.slice(0, idx), phrase: p, after: text.slice(idx + p.length) };
  }

  // Word-based: phrase words may appear in verse with different spacing
  const phraseWords = p.split(/\s+/).filter(Boolean);
  const textWords = text.split(/\s+/);
  if (phraseWords.length === 0) return { before: text, phrase: null, after: "" };

  let bestStart = -1;
  let bestEnd = -1;
  for (let i = 0; i <= textWords.length - phraseWords.length; i++) {
    let match = true;
    for (let j = 0; j < phraseWords.length; j++) {
      if (textWords[i + j] !== phraseWords[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      bestStart = i;
      bestEnd = i + phraseWords.length;
      break;
    }
  }

  if (bestStart >= 0 && bestEnd > bestStart) {
    const before = textWords.slice(0, bestStart).join(" ");
    const phrasePart = textWords.slice(bestStart, bestEnd).join(" ");
    const after = textWords.slice(bestEnd).join(" ");
    return { before, phrase: phrasePart, after };
  }

  return { before: text, phrase: null, after: "" };
}

/** Split verse text into words (same as display tokens). */
export function splitVerseIntoWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}
