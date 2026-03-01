from __future__ import annotations

from pydantic import BaseModel, Field


class BestEffortMatch(BaseModel):
    surah: int = Field(..., ge=1, le=114)
    ayah: int = Field(..., ge=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    matched_phrase: str | None = None
    matched_word_indices: list[int] | None = None


class RecognizeResponse(BaseModel):
    surah: int = Field(..., ge=1, le=114)
    ayah: int = Field(..., ge=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    matched_phrase: str | None = Field(default=None, description="Phrase from verse that was recited")
    matched_word_indices: list[int] | None = Field(default=None, description="Verse word indices for highlight")

