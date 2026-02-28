from __future__ import annotations

from pydantic import BaseModel, Field


class RecognizeResponse(BaseModel):
    surah: int = Field(..., ge=1, le=114)
    ayah: int = Field(..., ge=1)
    confidence: float = Field(..., ge=0.0, le=1.0)
    matched_phrase: str | None = Field(default=None, description="Phrase from verse that was recited")

