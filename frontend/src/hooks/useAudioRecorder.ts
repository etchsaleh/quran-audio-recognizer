"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type RecorderState = "idle" | "requesting_permission" | "recording" | "stopping";

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
    const v = (data[i] - 128) / 128; // [-1,1]
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

const DEFAULT_MIN_SECONDS = 1.5;

export function useAudioRecorder({
  maxSeconds = 12,
  minSeconds = DEFAULT_MIN_SECONDS,
}: {
  maxSeconds?: number;
  minSeconds?: number;
} = {}) {
  const [state, setState] = useState<RecorderState>("idle");
  const [level, setLevel] = useState(0); // 0..1
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const stopResolveRef = useRef<((b: Blob) => void) | null>(null);
  const stopRejectRef = useRef<((e: unknown) => void) | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const recordingStartRef = useRef<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const mimeType = useMemo(() => pickMimeType(), []);

  const cleanupMeter = useCallback(async () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    if (audioCtxRef.current) {
      const ctx = audioCtxRef.current;
      audioCtxRef.current = null;
      try {
        await ctx.close();
      } catch {
        // ignore
      }
    }
    setLevel(0);
  }, []);

  const cleanupStream = useCallback(() => {
    if (autoStopTimerRef.current) window.clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = null;
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
  }, []);

  const startMeter = useCallback(async (stream: MediaStream) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.fftSize);
    const tick = () => {
      const a = analyserRef.current;
      if (!a) return;
      a.getByteTimeDomainData(data);
      const rms = rmsFromTimeDomain(data);
      setLevel(Math.min(1, Math.max(0, rms * 1.4)));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    setError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      const needHttps = typeof window !== "undefined" && !window.isSecureContext;
      setError(
        needHttps
          ? "Microphone access requires a secure connection (HTTPS). Open this app via https:// or use Add to Home Screen from a secure site."
          : "This device or browser doesn’t support microphone access.",
      );
      return;
    }

    setState("requesting_permission");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      await startMeter(stream);

      chunksRef.current = [];
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onerror = (e) => {
        stopRejectRef.current?.(e);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || mimeType || "audio/webm" });
        stopResolveRef.current?.(blob);
      };

      rec.start(250);
      recordingStartRef.current = Date.now();
      setState("recording");

      autoStopTimerRef.current = window.setTimeout(() => {
        void stop();
      }, Math.max(2, maxSeconds) * 1000);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Microphone permission was denied.");
      setState("idle");
      cleanupStream();
      await cleanupMeter();
    }
  }, [cleanupMeter, cleanupStream, maxSeconds, mimeType, startMeter, state]);

  const stop = useCallback(async (): Promise<Blob> => {
    if (state !== "recording") {
      throw new Error("Recorder is not recording.");
    }
    setState("stopping");
    if (autoStopTimerRef.current) window.clearTimeout(autoStopTimerRef.current);
    autoStopTimerRef.current = null;

    const rec = recorderRef.current;
    if (!rec) throw new Error("Recorder unavailable.");

    const p = new Promise<Blob>((resolve, reject) => {
      stopResolveRef.current = resolve;
      stopRejectRef.current = reject;
    });

    try {
      rec.stop();
    } catch {
      // ignore
    }

    const blob = await p;
    const durationSec = (Date.now() - recordingStartRef.current) / 1000;
    if (durationSec < minSeconds) {
      cleanupStream();
      await cleanupMeter();
      setState("idle");
      throw new Error(`Record at least ${minSeconds} seconds. You recorded ${durationSec.toFixed(1)}s.`);
    }
    recorderRef.current = null;
    stopResolveRef.current = null;
    stopRejectRef.current = null;
    cleanupStream();
    await cleanupMeter();
    setState("idle");
    return blob;
  }, [cleanupMeter, cleanupStream, minSeconds, state]);

  useEffect(() => {
    return () => {
      cleanupStream();
      void cleanupMeter();
    };
  }, [cleanupMeter, cleanupStream]);

  return {
    state,
    isRecording: state === "recording",
    level,
    error,
    start,
    stop,
  };
}

