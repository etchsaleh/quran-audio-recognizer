"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HoldToRecordButton, type ButtonErrorState } from "@/components/HoldToRecordButton";
import { useChunkedRecorder } from "@/hooks/useChunkedRecorder";
import { api, type RecognizeError } from "@/lib/api/client";
import { processAudio } from "@/lib/audio/process";

const ERROR_DISPLAY_MS = 2500;
const LISTEN_MAX_MS = 20000;

export function HomeClient() {
  const router = useRouter();
  const maxDurationRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [errorState, setErrorState] = useState<ButtonErrorState>(null);
  const [micUnavailable, setMicUnavailable] = useState<boolean | null>(null);
  const errorClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopRecorderRef = useRef<(() => Promise<Blob>) | null>(null);
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
      try {
        const processed = await processAudio(chunkBlob);
        const wavBlob = new Blob([processed], { type: "audio/wav" });
        try {
          const res = await api.recognizeAudio(wavBlob);
          handleMatch({
            surah: res.surah,
            ayah: res.ayah,
            matched_phrase: res.matched_phrase ?? undefined,
            matched_word_indices: res.matched_word_indices ?? undefined,
          });
        } catch (e: unknown) {
          const err = e as RecognizeError;
          if (err.statusCode === 422 && err.bestEffort) {
            handleMatch({
              surah: err.bestEffort.surah,
              ayah: err.bestEffort.ayah,
              matched_phrase: err.bestEffort.matched_phrase ?? undefined,
              matched_word_indices: err.bestEffort.matched_word_indices ?? undefined,
            });
          }
        }
      } catch {
        // ignore
      }
    },
    [handleMatch],
  );

  const recorder = useChunkedRecorder({
    chunkIntervalMs: 7000,
    maxSeconds: 28,
    minChunkDurationMs: 6500,
    onChunk,
  });
  stopRecorderRef.current = recorder.stop;

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window !== "undefined" &&
      window.isSecureContext;
    setMicUnavailable(!ok);
  }, []);

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

  const busy = recognizing || recorder.isRecording;
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

  const hintMessage =
    errorState === "no_match"
        ? "Couldn’t identify – try again"
        : null;

  return (
    <main className="min-h-[100dvh] pt-safe-t flex flex-col bg-app-bg">
      <section className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
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
            recorder.isRecording ? (
              <>
                Listening
                <span className="listening-dots" aria-hidden>
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              </>
            ) : (
              "Tap to identify a verse"
            )
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
