"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { HoldToRecordButton } from "@/components/HoldToRecordButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { api } from "@/lib/api/client";

export function HomeClient() {
  const router = useRouter();
  const recorder = useAudioRecorder({ maxSeconds: 12 });
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micUnavailable, setMicUnavailable] = useState<boolean | null>(null);

  useEffect(() => {
    const ok =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof window !== "undefined" &&
      window.isSecureContext;
    setMicUnavailable(!ok);
  }, []);

  const busy = recognizing || recorder.state === "requesting_permission";
  const disableMic = busy || micUnavailable === true;

  async function handleTap() {
    if (recorder.isRecording) {
      try {
        setRecognizing(true);
        setError(null);
        const blob = await recorder.stop();
        const res = await api.recognizeAudio(blob);
        router.push(`/surah/${res.surah}?ayah=${res.ayah}`);
      } catch (e: unknown) {
        const raw = e instanceof Error ? e.message : "";
        if (raw.includes("422")) {
          setError("We couldn’t match that. Tap to record, recite a full verse, then tap again.");
        } else if (raw.includes("413")) {
          setError("Recording too long. Try a shorter recitation.");
        } else if (raw.includes("NETWORK:") || raw === "Failed to fetch") {
          setError("Can’t reach the server. Check the backend is running and try again.");
        } else {
          setError(raw || "Something went wrong. Please try again.");
        }
      } finally {
        setRecognizing(false);
      }
      return;
    }

    setError(null);
    try {
      await recorder.start();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not access microphone.";
      setError(msg);
    }
  }

  return (
    <>
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
            level={recorder.level}
            disabled={disableMic}
            onTap={handleTap}
            size="full"
          />

          <p className="mt-6 text-center text-[15px] font-medium text-white/80 max-w-[280px] transition-opacity duration-350">
            {recorder.isRecording
              ? "Tap again to identify verse"
              : "Tap to start, tap again to identify"}
          </p>

          {recorder.error && (
            <p className="mt-3 text-center text-sm" style={{ color: "#9B6DD4" }}>{recorder.error}</p>
          )}

          {error && (
            <div className="mt-4 w-full max-w-[320px]">
              <ErrorBanner message={error} dark />
            </div>
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

      <LoadingOverlay show={recognizing} label="Identifying verse…" dark />
    </>
  );
}
