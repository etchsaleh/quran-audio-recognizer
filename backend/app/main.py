from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.quran import router as quran_router
from app.api.routes.recognize import router as recognize_router
from app.core.config import get_settings
from app.core.logging import configure_logging
from app.services.quran_loader import QuranRepository
from app.services.transcription import WhisperTranscriber

# So Whisper's ffmpeg subprocess is found when the server is run from venv/IDE
_FFMPEG_PATHS = "/opt/homebrew/bin", "/usr/local/bin"


@asynccontextmanager
async def lifespan(app: FastAPI):
    extra = os.pathsep.join(p for p in _FFMPEG_PATHS if os.path.isdir(p))
    if extra:
        os.environ["PATH"] = extra + os.pathsep + os.environ.get("PATH", "")

    settings = get_settings()
    configure_logging(settings.env)

    quran_repo = QuranRepository.from_settings(settings)
    await quran_repo.ensure_loaded()
    app.state.quran_repo = quran_repo

    transcriber = WhisperTranscriber.from_settings(settings)
    if settings.preload_whisper:
        transcriber.ensure_loaded()
    app.state.transcriber = transcriber

    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Quran Audio Verse Recognition API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(quran_router, prefix="", tags=["quran"])
    app.include_router(recognize_router, prefix="", tags=["recognition"])
    return app


app = create_app()

