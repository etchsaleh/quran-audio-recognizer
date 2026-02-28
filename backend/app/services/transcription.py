from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

from faster_whisper import WhisperModel

from app.core.config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class Transcript:
    text: str


class WhisperTranscriber:
    def __init__(self, model_name: str, language: str, compute_type: str):
        self._model_name = model_name
        self._language = language
        self._compute_type = compute_type
        self._model: WhisperModel | None = None

    @classmethod
    def from_settings(cls, settings: Settings) -> "WhisperTranscriber":
        return cls(
            model_name=settings.whisper_model,
            language=settings.whisper_language,
            compute_type=settings.whisper_compute_type,
        )

    def ensure_loaded(self) -> None:
        if self._model is None:
            logger.info("Loading Whisper model: %s (compute_type=%s)", self._model_name, self._compute_type)
            self._model = WhisperModel(
                self._model_name,
                device="cpu",
                compute_type=self._compute_type,
            )

    def transcribe_file(self, audio_path: Path) -> Transcript:
        self.ensure_loaded()
        assert self._model is not None
        segments, _ = self._model.transcribe(
            str(audio_path),
            language=self._language,
        )
        text = " ".join(s.text for s in segments if s.text).strip()
        return Transcript(text=text)
