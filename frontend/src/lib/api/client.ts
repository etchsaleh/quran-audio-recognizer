import { apiBaseUrl } from "@/lib/config";
import type {
  BestEffortMatch,
  RecognizeResponse,
  Surah,
  SurahSummary,
} from "@/lib/api/types";

type FetchInit = RequestInit & { next?: { revalidate?: number } };

async function http<T>(path: string, init?: FetchInit): Promise<T> {
  const res = await fetch(`${apiBaseUrl()}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = text ? `${res.status} ${res.statusText}: ${text}` : `${res.status} ${res.statusText}`;
    throw new Error(msg);
  }
  return (await res.json()) as T;
}

export type RecognizeError = Error & {
  statusCode?: number;
  bestEffort?: BestEffortMatch;
};

export const api = {
  async getSurahs(): Promise<SurahSummary[]> {
    return await http<SurahSummary[]>("/surahs", { cache: "no-store" });
  },
  async getSurah(id: number): Promise<Surah> {
    return await http<Surah>(`/surahs/${id}`, { cache: "no-store" });
  },
  async recognizeAudio(blob: Blob, signal?: AbortSignal): Promise<RecognizeResponse> {
    const base = apiBaseUrl();
    const fd = new FormData();
    const ext = blob.type.includes("wav")
      ? "wav"
      : blob.type.includes("mp4")
        ? "mp4"
        : blob.type.includes("ogg")
          ? "ogg"
          : "webm";
    fd.append("file", blob, `audio.${ext}`);
    let res: Response;
    try {
      res = await fetch(`${base}/recognize`, { method: "POST", body: fd, signal });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to fetch";
      if (msg === "Failed to fetch" || msg.includes("Load failed") || msg.includes("NetworkError")) {
        throw new Error(
          `NETWORK: Could not reach the recognition server at ${base}. Make sure the backend is running (e.g. uvicorn on port 8000) and CORS allows this origin.`,
        );
      }
      throw e;
    }
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let body: unknown = null;
      try {
        body = JSON.parse(text);
      } catch {
        // use raw text
      }
      const detail =
        body && typeof body === "object" && "detail" in body && body.detail && typeof body.detail === "object"
          ? (body.detail as { message?: string; best_effort?: BestEffortMatch })
          : null;
      const err = new Error(
        detail?.message || (typeof text === "string" ? text : "") || `${res.status} ${res.statusText}`
      ) as RecognizeError;
      err.statusCode = res.status;
      err.bestEffort = detail?.best_effort ?? undefined;
      throw err;
    }
    return (await res.json()) as RecognizeResponse;
  },
};

