from __future__ import annotations

import logging
import tempfile
from dataclasses import dataclass
from pathlib import Path

from app.services.matcher import VerseMatcher
from app.services.quran_loader import QuranRepository
from app.services.transcription import WhisperTranscriber

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class RecognitionResult:
    surah: int
    ayah: int
    confidence: float
    matched_phrase: str | None = None
    matched_word_indices: tuple[int, ...] | None = None


class RecognizePipeline:
    def __init__(
        self,
        quran_repo: QuranRepository,
        transcriber: WhisperTranscriber,
        min_confidence: float,
    ):
        self._quran_repo = quran_repo
        self._transcriber = transcriber
        self._min_confidence = min_confidence
        self._matcher: VerseMatcher | None = None

    def _ensure_matcher(self) -> VerseMatcher:
        if self._matcher is None:
            self._matcher = VerseMatcher(self._quran_repo.verses_flat())
        return self._matcher

    def recognize_bytes(
        self, audio_bytes: bytes, suffix: str
    ) -> tuple[RecognitionResult | None, RecognitionResult | None]:
        """Returns (accepted_result, best_effort). Accepted if confidence >= threshold; best_effort is best match even when below."""
        matcher = self._ensure_matcher()

        with tempfile.TemporaryDirectory(prefix="quran-audio-") as d:
            audio_path = Path(d) / f"upload{suffix}"
            audio_path.write_bytes(audio_bytes)

            transcript = self._transcriber.transcribe_file(audio_path)
            if not transcript.text:
                logger.info("Empty transcript")
                return (None, None)

            match = matcher.match_best_span(transcript.text)
            if match is None:
                return (None, None)

            result = RecognitionResult(
                surah=match.surah,
                ayah=match.ayah,
                confidence=match.confidence,
                matched_phrase=match.matched_phrase,
                matched_word_indices=match.matched_word_indices if match.matched_word_indices else None,
            )
            if match.confidence >= self._min_confidence:
                return (result, result)
            logger.info("Low confidence match: score=%s conf=%s", match.score, match.confidence)
            return (None, result)

