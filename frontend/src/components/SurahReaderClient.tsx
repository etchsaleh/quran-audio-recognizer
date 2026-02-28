"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { StickyHeader } from "@/components/StickyHeader";
import { Verse } from "@/components/Verse";
import { MicFab } from "@/components/MicFab";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { useHighlightVerse } from "@/hooks/useHighlightVerse";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { api } from "@/lib/api/client";

export function SurahReaderClient({
  surah,
  title,
  subtitle,
  verses,
}: {
  surah: number;
  title: string;
  subtitle?: string;
  verses: Array<{ ayah: number; text: string }>;
}) {
  const router = useRouter();
  const { highlightedAyah } = useHighlightVerse(surah);

  const recorder = useAudioRecorder({ maxSeconds: 12 });
  const [recognizing, setRecognizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const busy = recognizing || recorder.state === "requesting_permission";

  async function onMicClick() {
    setError(null);
    if (recorder.isRecording) {
      try {
        setRecognizing(true);
        const blob = await recorder.stop();
        const res = await api.recognizeAudio(blob);
        // Navigate to matched verse. If same surah, query param change triggers highlight+scroll.
        router.push(`/surah/${res.surah}?ayah=${res.ayah}`);
      } catch (e: any) {
        const raw = e?.message ? String(e.message) : "";
        if (raw.includes("422")) {
          setError(
            "We could not confidently match this recitation. Please recite a full verse or slightly longer phrase and try again.",
          );
        } else if (raw.includes("413")) {
          setError("That recording was too long. Try a shorter recitation (a few seconds).");
        } else if (raw.includes("NETWORK:") || raw === "Failed to fetch") {
          setError(
            "Could not reach the recognition server. Start the backend (in the backend folder run: uvicorn app.main:app --reload --port 8000), then try again.",
          );
        } else {
          setError(raw || "Recognition failed. Check your network connection and try again.");
        }
      } finally {
        setRecognizing(false);
      }
      return;
    }

    try {
      await recorder.start();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Could not start recording.");
    }
  }

  return (
    <>
      <StickyHeader title={title} subtitle={subtitle} backHref="/surahs" />

      <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-4 bg-app-bg">
        {error ? <ErrorBanner message={error} className="mb-3" dark /> : null}
        {recorder.error ? <ErrorBanner message={recorder.error} className="mb-3" dark /> : null}

        <div className="grid gap-3">
          {verses.map((v) => (
            <Verse
              key={v.ayah}
              surah={surah}
              ayah={v.ayah}
              text={v.text}
              highlighted={highlightedAyah === v.ayah}
            />
          ))}
        </div>
      </main>

      <MicFab
        recording={recorder.isRecording}
        disabled={busy}
        onClick={onMicClick}
      />

      <LoadingOverlay show={recognizing} label="Matching your recitation" dark />
    </>
  );
}

