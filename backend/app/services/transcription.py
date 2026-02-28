from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import whisper

from app.core.config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class Transcript:
    text: str


class WhisperTranscriber:
    def __init__(self, model_name: str, language: str):
        self._model_name = model_name
        self._language = language
        self._model: Any | None = None

    @classmethod
    def from_settings(cls, settings: Settings) -> "WhisperTranscriber":
        return cls(model_name=settings.whisper_model, language=settings.whisper_language)

    def ensure_loaded(self) -> None:
        if self._model is None:
            logger.info("Loading Whisper model: %s", self._model_name)
            self._model = whisper.load_model(self._model_name)

    def transcribe_file(self, audio_path: Path) -> Transcript:
        self.ensure_loaded()
        assert self._model is not None
        # fp16 False keeps CPU compatibility; GPU users can still run efficiently.
        result = self._model.transcribe(
            str(audio_path),
            language=self._language,
            fp16=False,
        )
        text = (result.get("text") or "").strip()
        return Transcript(text=text)

