from __future__ import annotations

from pydantic import BaseModel, Field


class VerseOut(BaseModel):
    ayah: int = Field(..., ge=1)
    text: str = Field(..., min_length=1)


class SurahSummaryOut(BaseModel):
    surah: int = Field(..., ge=1, le=114)
    name: str
    transliteration: str | None = None
    type: str | None = None
    total_verses: int = Field(..., ge=1)


class SurahOut(SurahSummaryOut):
    verses: list[VerseOut]

