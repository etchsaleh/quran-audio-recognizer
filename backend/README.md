## Quran Audio Backend (FastAPI)

### Prerequisites
- **Python**: 3.11+
- **ffmpeg**: required by Whisper to decode audio

On macOS:

```bash
brew install ffmpeg
```

### Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -e ".[dev]"
cp .env.example .env
```

### Run (dev)

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### API
- **GET `/health`**: liveness probe
- **GET `/surahs`**: list surahs
- **GET `/surahs/{surah}`**: full surah with verses
- **POST `/recognize`**: upload audio, returns `{surah, ayah, confidence}`

### Environment variables
See `.env.example`. Key settings:
- **`QURAN_DATA_URL`**: Quran JSON source (downloaded once, cached locally)
- **`QURAN_DATA_PATH`**: local cache path (default: repo `data/quran.json`)
- **`WHISPER_MODEL`**: Whisper model (default: `OdyAsh/faster-whisper-base-ar-quran` for Quran; `base` for generic Arabic)
- **`WHISPER_COMPUTE_TYPE`**: `float16` for Quran model, `int8` for base
- **`MAX_UPLOAD_MB`**: upload size limit

### Notes
- On first boot, if the Quran dataset is not found locally, the server downloads it from
  `QURAN_DATA_URL` and caches it to `QURAN_DATA_PATH`.

