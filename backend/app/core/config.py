from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _repo_root() -> Path:
    # backend/app/core/config.py -> repo root is 3 parents up
    return Path(__file__).resolve().parents[3]


def _default_quran_path() -> Path:
    return _repo_root() / "data" / "quran.json"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = Field(default="dev", alias="ENV")

    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")

    cors_origins_raw: str = Field(default="http://localhost:3000", alias="CORS_ORIGINS")

    max_upload_mb: int = Field(default=12, alias="MAX_UPLOAD_MB")

    quran_data_path: Path = Field(
        default_factory=_default_quran_path,
        alias="QURAN_DATA_PATH",
    )

    @model_validator(mode="after")
    def _normalize_quran_data_path(self) -> "Settings":
        p = self.quran_data_path.resolve()
        if not str(self.quran_data_path).strip() or p.is_dir() or p == Path.cwd():
            object.__setattr__(self, "quran_data_path", _default_quran_path())
        return self
    quran_data_url: AnyHttpUrl = Field(
        default="https://raw.githubusercontent.com/amrayn/quran-text/master/quran-full-tashkeel.json",
        alias="QURAN_DATA_URL",
    )

    whisper_model: str = Field(
        default="OdyAsh/faster-whisper-base-ar-quran",
        alias="WHISPER_MODEL",
    )
    whisper_language: str = Field(default="ar", alias="WHISPER_LANGUAGE")
    whisper_compute_type: str = Field(
        default="float16",  # float16 for Quran model; int8 for base
        alias="WHISPER_COMPUTE_TYPE",
    )
    preload_whisper: bool = Field(default=False, alias="PRELOAD_WHISPER")

    min_confidence: float = Field(default=0.45, alias="MIN_CONFIDENCE")  # balanced: fewer wrong matches, fewer false negatives

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()

