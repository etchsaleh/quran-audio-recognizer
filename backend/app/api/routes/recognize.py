from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Request, UploadFile

from app.core.config import get_settings
from app.schemas.recognize import RecognizeResponse
from app.services.quran_loader import QuranRepository
from app.services.recognize_pipeline import RecognizePipeline
from app.services.transcription import WhisperTranscriber

router = APIRouter()


def _suffix(filename: str | None, content_type: str | None) -> str:
    if filename and "." in filename:
        ext = "." + filename.rsplit(".", 1)[-1].lower()
        if ext in {".webm", ".wav", ".mp3", ".m4a", ".ogg", ".mp4"}:
            return ext
    if content_type:
        if "webm" in content_type:
            return ".webm"
        if "wav" in content_type:
            return ".wav"
        if "mpeg" in content_type or "mp3" in content_type:
            return ".mp3"
        if "mp4" in content_type:
            return ".mp4"
        if "ogg" in content_type:
            return ".ogg"
    return ".webm"


def _get_services(request: Request) -> tuple[QuranRepository, WhisperTranscriber]:
    return request.app.state.quran_repo, request.app.state.transcriber


@router.post("/recognize", response_model=RecognizeResponse)
async def recognize(request: Request, file: UploadFile = File(...)) -> RecognizeResponse:
    settings = get_settings()
    audio = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(audio) == 0:
        raise HTTPException(status_code=400, detail="Empty audio upload")
    if len(audio) > max_bytes:
        raise HTTPException(status_code=413, detail="Audio upload too large")

    quran_repo, transcriber = _get_services(request)
    pipeline = RecognizePipeline(quran_repo=quran_repo, transcriber=transcriber, min_confidence=settings.min_confidence)

    result = pipeline.recognize_bytes(audio_bytes=audio, suffix=_suffix(file.filename, file.content_type))
    if result is None:
        raise HTTPException(status_code=422, detail="Could not confidently recognize a verse")

    return RecognizeResponse(surah=result.surah, ayah=result.ayah, confidence=result.confidence)

