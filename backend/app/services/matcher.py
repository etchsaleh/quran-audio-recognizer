from __future__ import annotations

from dataclasses import dataclass

from rapidfuzz import fuzz

from app.services.quran_loader import VerseEntry
from app.utils.arabic_text import normalize_arabic


@dataclass(frozen=True, slots=True)
class MatchResult:
    surah: int
    ayah: int
    confidence: float
    score: float


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
        for tok in set(q_tokens):
            for idx in self._token_to_indices.get(tok, []):
                counts[idx] = counts.get(idx, 0) + 1

        if not counts:
            return list(range(len(self._verses)))

        # Keep the most overlapping candidates; this makes scoring fast and stable.
        ranked = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:250]
        return [idx for idx, _ in ranked]

    @staticmethod
    def _score(q_norm: str, v_norm: str) -> float:
        # Blend a robust scorer with partial-scoring (recitation often contains verse fragments).
        wr = float(fuzz.WRatio(q_norm, v_norm)) / 100.0
        ts = float(fuzz.token_set_ratio(q_norm, v_norm)) / 100.0
        pr = float(fuzz.partial_ratio(q_norm, v_norm)) / 100.0
        return max(wr, ts * 0.96, pr * 0.98)

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

        # Confidence uses both absolute score and "uniqueness" (margin vs runner-up).
        strength = _clamp01((best_score - 0.45) / 0.55)  # ramp up after ~0.45
        uniqueness = _clamp01(margin / 0.12)  # ~0.12 gap is a strong indicator
        confidence = _clamp01(strength * 0.75 + uniqueness * 0.25)

        return MatchResult(
            surah=verse.surah,
            ayah=verse.ayah,
            confidence=confidence,
            score=best_score,
        )

