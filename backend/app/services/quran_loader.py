from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx

from app.core.config import Settings
from app.utils.arabic_text import normalize_arabic

logger = logging.getLogger(__name__)


@dataclass(frozen=True, slots=True)
class VerseEntry:
    surah: int
    ayah: int
    text: str
    text_norm: str


@dataclass(frozen=True, slots=True)
class Surah:
    surah: int
    name: str
    transliteration: str | None
    type: str | None
    total_verses: int
    verses: list[dict[str, Any]]  # {ayah, text}


class QuranRepository:
    def __init__(self, data_path: Path, data_url: str):
        self._data_path = data_path
        self._data_url = data_url
        self._surahs: list[Surah] | None = None
        self._verses_flat: list[VerseEntry] | None = None

    @classmethod
    def from_settings(cls, settings: Settings) -> "QuranRepository":
        return cls(data_path=settings.quran_data_path, data_url=str(settings.quran_data_url))

    async def ensure_loaded(self) -> None:
        if self._surahs is not None and self._verses_flat is not None:
            return

        await self._ensure_data_file()
        surahs_raw = self._load_json(self._data_path)
        surahs, verses_flat = self._parse_surahs(surahs_raw)
        self._surahs = surahs
        self._verses_flat = verses_flat
        logger.info("Loaded Quran dataset: %s surahs, %s verses", len(surahs), len(verses_flat))

    def surahs(self) -> list[Surah]:
        if self._surahs is None:
            raise RuntimeError("QuranRepository not loaded")
        return self._surahs

    def surah(self, surah: int) -> Surah:
        if self._surahs is None:
            raise RuntimeError("QuranRepository not loaded")
        if not (1 <= surah <= 114):
            raise KeyError("invalid surah")
        return self._surahs[surah - 1]

    def verses_flat(self) -> list[VerseEntry]:
        if self._verses_flat is None:
            raise RuntimeError("QuranRepository not loaded")
        return self._verses_flat

    async def _ensure_data_file(self) -> None:
        self._data_path.parent.mkdir(parents=True, exist_ok=True)
        if self._data_path.exists() and self._data_path.stat().st_size > 0:
            return

        logger.info("Downloading Quran dataset to %s", self._data_path)
        timeout = httpx.Timeout(30.0, connect=10.0)
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True) as client:
            resp = await client.get(self._data_url)
            resp.raise_for_status()
            self._data_path.write_bytes(resp.content)

    @staticmethod
    def _load_json(path: Path) -> Any:
        return json.loads(path.read_text(encoding="utf-8"))

    @staticmethod
    def _parse_surahs(surahs_raw: Any) -> tuple[list[Surah], list[VerseEntry]]:
        if not isinstance(surahs_raw, list) or len(surahs_raw) != 114:
            raise ValueError("Unexpected Quran JSON format (expected array of 114 surahs)")

        surahs: list[Surah] = []
        flat: list[VerseEntry] = []

        for s in surahs_raw:
            sid = int(s["id"])
            name = str(s.get("name") or "")
            transliteration = s.get("transliteration")
            stype = s.get("type")
            total_verses = int(s.get("total_verses") or len(s.get("verses") or []))
            verses_in = s.get("verses") or []
            verses_out: list[dict[str, Any]] = []

            for v in verses_in:
                ayah = int(v["id"])
                text = str(v["text"])
                text_norm = normalize_arabic(text)
                flat.append(VerseEntry(surah=sid, ayah=ayah, text=text, text_norm=text_norm))
                verses_out.append({"ayah": ayah, "text": text})

            surahs.append(
                Surah(
                    surah=sid,
                    name=name,
                    transliteration=str(transliteration) if transliteration is not None else None,
                    type=str(stype) if stype is not None else None,
                    total_verses=total_verses,
                    verses=verses_out,
                )
            )

        return surahs, flat

