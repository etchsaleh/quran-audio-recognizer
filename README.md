# Quran — Identify verses by recitation

Mobile-first app: hold the button, recite a verse, get taken to it. Built with Next.js (frontend) and FastAPI + Whisper (backend).

## Repo structure

- **`frontend/`** — Next.js 14 (App Router), TypeScript, Tailwind, PWA
- **`backend/`** — FastAPI, Whisper, fuzzy verse matching
- **`data/`** — Quran JSON (downloaded by backend on first run)

## Run locally

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env
# Install ffmpeg (required by Whisper): e.g. brew install ffmpeg
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local` for local API.

---

## Host on GitHub and deploy frontend to Vercel

### 1. Push this repo to GitHub

From the project root (`quran-audio-recognizer`):

```bash
git init
git add .
git commit -m "Initial commit: Quran reader with audio verse recognition"
```

Create a **new repository** on [GitHub](https://github.com/new) (e.g. `quran-audio-recognizer`). Do **not** add a README or .gitignore (you already have them). Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/quran-audio-recognizer.git
git branch -M main
git push -u origin main
```

(Replace `YOUR_USERNAME` with your GitHub username.)

### 2. Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (use “Continue with GitHub”).
2. Click **Add New… → Project** and **import** your `quran-audio-recognizer` repo.
3. **Root Directory**: click **Edit**, set to **`frontend`**, then **Continue**.
4. **Environment variables**: add:
   - **Name:** `NEXT_PUBLIC_API_BASE_URL`  
   - **Value:** your backend API URL (see below).
5. Click **Deploy**.

Vercel will build and deploy the Next.js app. Later commits to `main` will trigger new deployments.

### 3. Backend URL for production

The frontend needs a live backend so “hold to identify” works in production. Options:

- **Option A — Deploy backend on Railway / Render / Fly.io**  
  Deploy the `backend/` folder (e.g. [Railway](https://railway.app), [Render](https://render.com)), then use that URL (e.g. `https://your-app.up.railway.app`) as `NEXT_PUBLIC_API_BASE_URL` in Vercel.
- **Option B — Local only**  
  Leave `NEXT_PUBLIC_API_BASE_URL` pointing to `http://localhost:8000` only for local runs; the deployed app will show an error when using the mic until you deploy a backend and set this variable.

After the backend is deployed, in Vercel go to **Project → Settings → Environment Variables**, set `NEXT_PUBLIC_API_BASE_URL` to your backend URL, and redeploy.

---

## Backend deployment (optional)

To run the backend in the cloud (so the Vercel app can call it):

- **Railway:** Create a new project, add a service from your GitHub repo, set **Root Directory** to `backend`, add a start command like `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, and add `ffmpeg` if needed via a buildpack or Nixpacks.
- **Render:** New Web Service, connect the repo, set root to `backend`, build `pip install -e .`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add **ffmpeg** in the environment (e.g. Render’s native support or a Dockerfile).

Use the public URL of that service as `NEXT_PUBLIC_API_BASE_URL` in Vercel.
