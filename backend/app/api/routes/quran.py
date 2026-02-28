from __future__ import annotations

from fastapi import APIRouter, Request

from app.schemas.quran import SurahOut, SurahSummaryOut, VerseOut
from app.services.quran_loader import QuranRepository

router = APIRouter()


def _repo(request: Request) -> QuranRepository:
    return request.app.state.quran_repo


@router.get("/surahs", response_model=list[SurahSummaryOut])
async def list_surahs(request: Request) -> list[SurahSummaryOut]:
    repo = _repo(request)
    return [
        SurahSummaryOut(
            surah=s.surah,
            name=s.name,
            transliteration=s.transliteration,
            type=s.type,
            total_verses=s.total_verses,
        )
        for s in repo.surahs()
    ]


@router.get("/surahs/{surah}", response_model=SurahOut)
async def get_surah(request: Request, surah: int) -> SurahOut:
    repo = _repo(request)
    s = repo.surah(surah)
    return SurahOut(
        surah=s.surah,
        name=s.name,
        transliteration=s.transliteration,
        type=s.type,
        total_verses=s.total_verses,
        verses=[VerseOut(ayah=v["ayah"], text=v["text"]) for v in s.verses],
    )

