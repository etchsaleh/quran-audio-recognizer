from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz, process

from app.services.quran_loader import VerseEntry
from app.utils.arabic_text import normalize_arabic


def _word_split(text: str) -> list[str]:
    """Split by whitespace, 1:1 alignment with normalized."""
    return [w for w in text.split() if w]


def _extract_matched_phrase(verse: VerseEntry, query_norm: str) -> str | None:
    """Find the span of verse text that best matches the transcript."""
    v_norm_words = _word_split(verse.text_norm)
    v_orig_words = _word_split(verse.text)
    if not v_norm_words or len(v_norm_words) != len(v_orig_words):
        return None
    q_words = _word_split(query_norm)
    if not q_words:
        return None

    best_score = 0.0
    best_start, best_end = 0, 0

    for i in range(len(v_norm_words)):
        for j in range(i + 1, len(v_norm_words) + 1):
            span_norm = " ".join(v_norm_words[i:j])
            s = fuzz.partial_ratio(query_norm, span_norm) / 100.0
            if s > best_score:
                best_score = s
                best_start, best_end = i, j

    if best_score < 0.5:
        return None
    return " ".join(v_orig_words[best_start:best_end])


@dataclass(frozen=True, slots=True)
class MatchResult:
    surah: int
    ayah: int
    confidence: float
    score: float
    matched_phrase: str | None = None


def _tokenize(text_norm: str) -> list[str]:
    # Arabic already normalized to whitespace-separated tokens.
    return [t for t in text_norm.split(" ") if len(t) >= 2]


def _clamp01(x: float) -> float:
    return 0.0 if x < 0.0 else 1.0 if x > 1.0 else x


class VerseMatcher:
    def __init__(self, verses: list[VerseEntry]):
        self._verses = verses
        self._verse_tokens: list[list[str]] = [_tokenize(v.text_norm) for v in verses]
        self._token_to_indices: dict[str, list[int]] = {}
        for idx, toks in enumerate(self._verse_tokens):
            for tok in set(toks):
                self._token_to_indices.setdefault(tok, []).append(idx)

    def _candidate_indices(self, q_norm: str) -> list[int]:
        q_tokens = _tokenize(q_norm)
        # For very short phrases, token indexing is unreliable; fall back to full scan.
        if len(q_tokens) < 3:
            return list(range(len(self._verses)))

        counts: dict[int, int] = {}
        all_tokens = list(self._token_to_indices.keys())
        for tok in set(q_tokens):
            if tok in self._token_to_indices:
                for idx in self._token_to_indices[tok]:
                    counts[idx] = counts.get(idx, 0) + 1
            else:
                # Fuzzy match for tokens Whisper may have transcribed slightly wrong
                best = process.extractOne(tok, all_tokens, scorer=fuzz.ratio, score_cutoff=88)
                if best:
                    sim_tok = best[0]
                    for idx in self._token_to_indices[sim_tok]:
                        counts[idx] = counts.get(idx, 0) + 1

        if not counts:
            return list(range(len(self._verses)))

        # Keep more candidates for better accuracy; rank by overlap.
        ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:400]
        return [idx for idx, _ in ranked]

    @staticmethod
    def _score(q_norm: str, v_norm: str) -> float:
        """Blend multiple scorers; prefer partial when transcript is fragment, ratio when full verse."""
        q_len = len(q_norm)
        v_len = len(v_norm)
        length_ratio = q_len / max(v_len, 1)

        # Core scores (0-1)
        ratio_sc = fuzz.ratio(q_norm, v_norm) / 100.0
        partial_sc = fuzz.partial_ratio(q_norm, v_norm) / 100.0
        token_set_sc = fuzz.token_set_ratio(q_norm, v_norm) / 100.0
        token_sort_sc = fuzz.token_sort_ratio(q_norm, v_norm) / 100.0

        # When transcript is a fragment (< 60% of verse), partial_ratio is most reliable.
        # When similar length, ratio and token_sort matter more.
        if length_ratio < 0.6:
            base = max(partial_sc, token_set_sc * 0.95)
        else:
            base = max(ratio_sc, partial_sc * 0.98, token_sort_sc * 0.97)

        return base

    def match(self, transcript: str) -> MatchResult | None:
        q = normalize_arabic(transcript)
        if not q or len(q) < 4:
            return None

        cand = self._candidate_indices(q)
        best_idx: int | None = None
        best_score = -1.0
        second_score = -1.0

        for idx in cand:
            v = self._verses[idx]
            s = self._score(q, v.text_norm)
            if s > best_score:
                second_score = best_score
                best_score = s
                best_idx = idx
            elif s > second_score:
                second_score = s

        if best_idx is None:
            return None

        verse = self._verses[best_idx]
        margin = max(0.0, best_score - max(0.0, second_score))

        # Balanced: avoid wrong matches but limit false negatives
        MIN_SCORE = 0.55
        MIN_MARGIN = 0.04
        if best_score < MIN_SCORE:
            return None
        if margin < MIN_MARGIN:
            return None  # ambiguous: best and runner-up too close

        # Confidence: blend score strength and winner clarity
        strength = _clamp01((best_score - 0.50) / 0.50)  # ramp up after ~0.50
        uniqueness = _clamp01(margin / 0.08)  # ~0.08 gap is a strong indicator
        confidence = _clamp01(strength * 0.75 + uniqueness * 0.25)

        matched_phrase = _extract_matched_phrase(verse, q)
        return MatchResult(
            surah=verse.surah,
            ayah=verse.ayah,
            confidence=confidence,
            score=best_score,
            matched_phrase=matched_phrase,
        )

