"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HoldToRecordButton, type ButtonErrorState } from "@/components/HoldToRecordButton";
import { useChunkedRecorder } from "@/hooks/useChunkedRecorder";
import { api, type RecognizeError } from "@/lib/api/client";
import { processAudioFromBlobs } from "@/lib/audio/process";

const ERROR_DISPLAY_MS = 2500;
const LISTEN_MAX_MS = 18000;
const CHUNK_INTERVAL_MS = 1000;
const MIN_CHUNK_MS = 800;
const WINDOW_CHUNKS = 6; // 6s minimum for meaningful recognition

const CONFIDENCE_HIGH = 0.52; // single result: stop immediately
const CONFIDENCE_AGREE = 0.4; // two agreeing results: stop
const SPEECH_LEVEL_THRESHOLD = 0.08;
const LEVEL_POLL_MS = 200;
const SPEECH_SAMPLES_REQUIRED = 2;

type MatchResult = {
  surah: number;
  ayah: number;
  confidence: number;
  matched_phrase?: string | null;
  matched_word_indices?: number[] | null;
};

export function HomeClient() {
  const router = useRouter();
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [errorState, setErrorState] = useState<ButtonErrorState>(null);
  const [micUnavailable, setMicUnavailable] = useState<boolean | null>(null);
  const errorClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecorderRef = useRef<(() => Promise<Blob>) | null>(null);
  const chunkBufferRef = useRef<Blob[]>([]);
  const resultsRef = useRef<MatchResult[]>([]);
  const meaningfulSpeechRef = useRef(false);
  const speechSampleCountRef = useRef(0);
  const levelPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelRef = useRef(0);
  const pendingRequestRef = useRef(false);
  const [phase, setPhase] = useState<"listening" | "identifying">("listening");

  const handleMatch = useCallback(
    (res: { surah: number; ayah: number; matched_phrase?: string | null; matched_word_indices?: number[] | null }) => {
      if (maxDurationRef.current) {
        clearTimeout(maxDurationRef.current);
        maxDurationRef.current = null;
      }
      stopRecorderRef.current?.().catch(() => {});
      if (typeof sessionStorage !== "undefined" && res.matched_phrase) {
        sessionStorage.setItem("quran-matched-phrase", res.matched_phrase);
      }
      if (typeof sessionStorage !== "undefined" && res.matched_word_indices?.length) {
        sessionStorage.setItem("quran-matched-word-indices", JSON.stringify(res.matched_word_indices));
      }
      router.push(`/surah/${res.surah}?ayah=${res.ayah}`);
      setRecognizing(false);
    },
    [router],
  );

  const onChunk = useCallback(
    async (chunkBlob: Blob) => {
      chunkBufferRef.current = [...chunkBufferRef.current, chunkBlob].slice(-WINDOW_CHUNKS);
      if (chunkBufferRef.current.length < WINDOW_CHUNKS || pendingRequestRef.current) return;

      pendingRequestRef.current = true;
      setPhase("identifying");

      try {
        const merged = await processAudioFromBlobs(chunkBufferRef.current);
        const wavBlob = new Blob([merged], { type: "audio/wav" });
        let res: MatchResult | null = null;
        try {
          const apiRes = await api.recognizeAudio(wavBlob);
          res = {
            surah: apiRes.surah,
            ayah: apiRes.ayah,
            confidence: apiRes.confidence,
            matched_phrase: apiRes.matched_phrase ?? undefined,
            matched_word_indices: apiRes.matched_word_indices ?? undefined,
          };
        } catch (e: unknown) {
          const err = e as RecognizeError;
          if (err.statusCode === 422 && err.bestEffort) {
            res = {
              surah: err.bestEffort.surah,
              ayah: err.bestEffort.ayah,
              confidence: err.bestEffort.confidence,
              matched_phrase: err.bestEffort.matched_phrase ?? undefined,
              matched_word_indices: err.bestEffort.matched_word_indices ?? undefined,
            };
          }
        } finally {
          pendingRequestRef.current = false;
        }

        if (!res) return;

        resultsRef.current = [...resultsRef.current, res].slice(-3);
        const results = resultsRef.current;

        if (res.confidence >= CONFIDENCE_HIGH) {
          handleMatch({
            surah: res.surah,
            ayah: res.ayah,
            matched_phrase: res.matched_phrase ?? undefined,
            matched_word_indices: res.matched_word_indices ?? undefined,
          });
          return;
        }

        if (meaningfulSpeechRef.current && results.length >= 2) {
          const a = results[results.length - 2];
          const b = results[results.length - 1];
          if (
            a.surah === b.surah &&
            a.ayah === b.ayah &&
            a.confidence >= CONFIDENCE_AGREE &&
            b.confidence >= CONFIDENCE_AGREE
          ) {
            handleMatch({
              surah: b.surah,
              ayah: b.ayah,
              matched_phrase: b.matched_phrase ?? undefined,
              matched_word_indices: b.matched_word_indices ?? undefined,
            });
          }
        }
      } catch {
        pendingRequestRef.current = false;
      }
    },
    [handleMatch],
  );

  const recorder = useChunkedRecorder({
    chunkIntervalMs: CHUNK_INTERVAL_MS,
    maxSeconds: Math.ceil(LISTEN_MAX_MS / 1000) + 1,
    minChunkDurationMs: MIN_CHUNK_MS,
    onChunk,
  });
  stopRecorderRef.current = recorder.stop;
  levelRef.current = recorder.level;

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window !== "undefined" &&
      window.isSecureContext;
    setMicUnavailable(!ok);
  }, []);

  useEffect(() => {
    if (!recorder.isRecording) {
      if (levelPollRef.current) {
        clearInterval(levelPollRef.current);
        levelPollRef.current = null;
      }
      chunkBufferRef.current = [];
      resultsRef.current = [];
      meaningfulSpeechRef.current = false;
      speechSampleCountRef.current = 0;
      setPhase("listening");
      return;
    }

    levelPollRef.current = setInterval(() => {
      const level = levelRef.current;
      if (level >= SPEECH_LEVEL_THRESHOLD) {
        speechSampleCountRef.current += 1;
        if (speechSampleCountRef.current >= SPEECH_SAMPLES_REQUIRED) {
          meaningfulSpeechRef.current = true;
        }
      } else {
        speechSampleCountRef.current = 0;
      }
    }, LEVEL_POLL_MS);

    return () => {
      if (levelPollRef.current) {
        clearInterval(levelPollRef.current);
        levelPollRef.current = null;
      }
    };
  }, [recorder.isRecording]);

  useEffect(() => {
    if (errorState == null) return;
    if (errorClearRef.current) clearTimeout(errorClearRef.current);
    errorClearRef.current = setTimeout(() => {
      setErrorState(null);
      errorClearRef.current = null;
    }, ERROR_DISPLAY_MS);
    return () => {
      if (errorClearRef.current) clearTimeout(errorClearRef.current);
    };
  }, [errorState]);

  const disableMic = micUnavailable === true;

  async function handleTap() {
    if (recorder.isRecording) {
      if (maxDurationRef.current) {
        clearTimeout(maxDurationRef.current);
        maxDurationRef.current = null;
      }
      setRecognizing(false);
      setErrorState(null);
      recorder.stop().catch(() => {});
      return;
    }

    setErrorState(null);
    setRecognizing(true);
    setPhase("listening");
    try {
      await recorder.start();
      maxDurationRef.current = setTimeout(() => {
        maxDurationRef.current = null;
        recorder.stop().then(() => {
          setRecognizing(false);
          setErrorState("no_match");
        }).catch(() => {
          setRecognizing(false);
        });
      }, LISTEN_MAX_MS);
    } catch (e: unknown) {
      setRecognizing(false);
      setErrorState("no_match");
    }
  }

  const hintMessage = errorState === "no_match" ? "Couldn't identify – try again" : null;
  const statusLabel = !recorder.isRecording
    ? "Tap to identify a verse"
    : phase === "identifying"
      ? "Identifying"
      : "Listening";

  return (
    <main className="min-h-[100dvh] pt-safe-t flex flex-col bg-app-bg">
      <section className="flex-1 flex flex-col items-center justify-center px-4 min-h-0 pt-12">
        <p className="absolute top-0 left-0 right-0 pt-safe-t pt-12 pb-2 text-center font-display text-[19px] font-black text-white">
          Find your place in the recitation.
        </p>
        {micUnavailable === true && (
          <div className="absolute top-0 left-0 right-0 mx-4 mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
            <p className="text-[13px] font-medium text-amber-200">
              Microphone needs a secure connection (HTTPS). Browse surahs below.
            </p>
          </div>
        )}

        <HoldToRecordButton
          isRecording={recorder.isRecording}
          identifying={recognizing}
          identifyingShowsLoader={false}
          level={recorder.level}
          disabled={disableMic}
          onTap={handleTap}
          size="full"
          errorState={errorState}
        />

        <p
          className={[
            "mt-14 text-center text-[15px] font-medium max-w-[280px] transition-opacity duration-300 flex items-center justify-center gap-0.5",
            hintMessage ? "text-red-300" : "text-white/80",
          ].join(" ")}
        >
          {hintMessage ?? (
            <>
              {statusLabel}
              {recorder.isRecording && (
                <span className="listening-dots" aria-hidden>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              )}
            </>
          )}
        </p>

        {recorder.error && !hintMessage && (
          <p className="mt-3 text-center text-sm text-white/60">{recorder.error}</p>
        )}
      </section>

      <div
        className="w-full px-4 pt-3 bg-app-bg"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <Link
          href="/surahs"
          className="flex items-center justify-center w-full rounded-2xl h-14 text-white font-semibold text-[17px] transition-all duration-300 active:scale-[0.98] active:opacity-90"
          style={{ backgroundColor: "#7C40C6" }}
        >
          Surahs
        </Link>
      </div>
    </main>
  );
}
