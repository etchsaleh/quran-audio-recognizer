"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_CHUNK_MS = 2500;
const MIN_CHUNK_DURATION_MS = 1500;

function pickMimeType(): string | undefined {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return undefined;
}

function rmsFromTimeDomain(data: Uint8Array): number {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

/**
 * Records audio and calls onChunk every chunkIntervalMs with a blob of the last chunk.
 * On stop(), returns the full recording blob.
 * Uses two MediaRecorders in rotation to produce chunks without stopping the stream.
 */
export function useChunkedRecorder({
  chunkIntervalMs = DEFAULT_CHUNK_MS,
  maxSeconds = 12,
  minChunkDurationMs = MIN_CHUNK_DURATION_MS,
  onChunk,
  mimeType: mimeTypeOverride,
}: {
  chunkIntervalMs?: number;
  maxSeconds?: number;
  minChunkDurationMs?: number;
  onChunk?: (blob: Blob) => void;
  mimeType?: string;
} = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const allChunksRef = useRef<BlobPart[]>([]);
  const chunkStartRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRecRef = useRef<MediaRecorder | null>(null);
  const currentChunksRef = useRef<BlobPart[]>([]);
  const stopResolveRef = useRef<((b: Blob) => void) | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const mime = mimeTypeOverride ?? (typeof window !== "undefined" ? pickMimeType() : undefined);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (currentRecRef.current?.state === "recording") {
      try {
        currentRecRef.current.stop();
      } catch {
        // ignore
      }
      currentRecRef.current = null;
    }
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {
        // ignore
      }
      audioCtxRef.current = null;
    }
    setLevel(0);
  }, []);

  const start = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Microphone not available.");
      return;
    }
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.85;
      source.connect(analyser);
      analyserRef.current = analyser;
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        const r = rmsFromTimeDomain(data);
        setLevel(Math.min(1, Math.max(0, r * 1.4)));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      allChunksRef.current = [];
      currentChunksRef.current = [];
      chunkStartRef.current = Date.now();

      const startRecorder = () => {
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        const chunks: BlobPart[] = [];
        rec.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        rec.onstop = () => {
          for (const c of chunks) allChunksRef.current.push(c);
          const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
          const durationSec = (Date.now() - chunkStartRef.current) / 1000;
          chunkStartRef.current = Date.now();

          if (stopResolveRef.current) {
            const full = new Blob(allChunksRef.current, { type: rec.mimeType || mime || "audio/webm" });
            stopResolveRef.current(full);
            stopResolveRef.current = null;
            cleanup();
            return;
          }
          if (blob.size > 0 && durationSec * 1000 >= minChunkDurationMs && onChunkRef.current) {
            onChunkRef.current(blob);
          }
          if (streamRef.current) startRecorder();
        };
        rec.start(100);
        currentRecRef.current = rec;
        currentChunksRef.current = chunks;
      };

      startRecorder();
      intervalRef.current = setInterval(() => {
        const rec = currentRecRef.current;
        if (!rec || rec.state !== "recording") return;
        rec.stop();
        currentRecRef.current = null;
      }, chunkIntervalMs);

      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start recording.");
      cleanup();
    }
  }, [chunkIntervalMs, minChunkDurationMs, mime, cleanup]);

  const stop = useCallback((): Promise<Blob> => {
    if (!intervalRef.current && !currentRecRef.current) {
      return Promise.reject(new Error("Not recording."));
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const rec = currentRecRef.current;
    if (!rec || rec.state !== "recording") {
      const full = new Blob(allChunksRef.current, { type: mime ? `audio/${mime.includes("webm") ? "webm" : "ogg"}` : "audio/webm" });
      setIsRecording(false);
      cleanup();
      return Promise.resolve(full);
    }
    return new Promise<Blob>((resolve) => {
      stopResolveRef.current = resolve;
      currentRecRef.current = null;
      setIsRecording(false);
      rec.stop();
    });
  }, [mime, cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { isRecording, level, error, start, stop };
}
