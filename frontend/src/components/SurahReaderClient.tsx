"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { StickyHeader } from "@/components/StickyHeader";
import { Verse } from "@/components/Verse";
import { SurahNav } from "@/components/SurahNav";
import { useHighlightVerse } from "@/hooks/useHighlightVerse";
import { useBookmarks } from "@/hooks/useBookmarks";
import { fetchVerseMeaning } from "@/lib/verse-meaning";
import type { SurahSummary } from "@/lib/api/types";

const PULL_MAX_PX = 160;
const THRESHOLD_PX = 88;
const DEAD_ZONE_PX = 8; // ignore tiny accidental pulls

/** iOS-style resistance: 1:1 for first 70%, then elastic slowdown. */
function applyResistance(distance: number, max = PULL_MAX_PX): number {
  if (distance <= max * 0.7) return distance;
  const extra = distance - max * 0.7;
  return max * 0.7 + extra * 0.35;
}

const EASE_SNAP_BACK = "cubic-bezier(0.22, 1, 0.36, 1)";

type GestureState = "IDLE" | "PULLING" | "THRESHOLD_REACHED" | "SNAPPING";

export function SurahReaderClient({
  surah,
  title,
  subtitle,
  verses,
  surahs,
}: {
  surah: number;
  title: string;
  subtitle?: string;
  verses: Array<{ ayah: number; text: string }>;
  surahs: SurahSummary[];
}) {
  const router = useRouter();
  const { highlightedAyah, matchedPhrase, matchedWordIndices } = useHighlightVerse(surah);
  const { isBookmarked, toggleBookmark } = useBookmarks();

  const nextSurah = useMemo(() => {
    const idx = surahs.findIndex((s) => s.surah === surah);
    if (idx < 0) return null;
    return surahs[idx + 1] ?? null;
  }, [surahs, surah]);

  const atBottomRef = useRef(false);
  const touchActiveRef = useRef(false);
  const startYRef = useRef<number | null>(null);
  const pullDistanceRef = useRef(0);
  const progressRef = useRef(0);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const thresholdReachedRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [gestureState, setGestureState] = useState<GestureState>("IDLE");
  const gestureStateRef = useRef<GestureState>("IDLE");
  const [pullProgress, setPullProgress] = useState(0);
  const setPullProgressRef = useRef(setPullProgress);
  setPullProgressRef.current = setPullProgress;

  const [expandedVerse, setExpandedVerse] = useState<{ surah: number; ayah: number } | null>(null);
  const [verseMeaning, setVerseMeaning] = useState<string | null>(null);
  const [verseMeaningLoading, setVerseMeaningLoading] = useState(false);

  const handleTapVerse = useCallback((s: number, a: number) => {
    setExpandedVerse((prev) => (prev?.surah === s && prev?.ayah === a ? null : { surah: s, ayah: a }));
  }, []);

  useEffect(() => {
    gestureStateRef.current = gestureState;
  }, [gestureState]);

  useEffect(() => {
    if (!expandedVerse) {
      setVerseMeaning(null);
      setVerseMeaningLoading(false);
      return;
    }
    let cancelled = false;
    setVerseMeaningLoading(true);
    setVerseMeaning(null);
    fetchVerseMeaning(expandedVerse.surah, expandedVerse.ayah)
      .then((text) => {
        if (!cancelled) setVerseMeaning(text);
      })
      .catch(() => {
        if (!cancelled) setVerseMeaning(null);
      })
      .finally(() => {
        if (!cancelled) setVerseMeaningLoading(false);
      });
    return () => { cancelled = true; };
  }, [expandedVerse]);

  useEffect(() => {
    if (!nextSurah) return;

    const computeAtBottom = () => {
      const el = document.documentElement;
      const bottom = window.innerHeight + window.scrollY >= el.scrollHeight - 2;
      atBottomRef.current = bottom;
      if (!bottom && pullDistanceRef.current > 0) {
        pullDistanceRef.current = 0;
        progressRef.current = 0;
        thresholdReachedRef.current = false;
        setGestureState("IDLE");
        setPullProgressRef.current(0);
      }
    };

    const updatePullUI = () => {
      setPullProgressRef.current(progressRef.current);
    };

    const flushRaf = () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      rafIdRef.current = requestAnimationFrame(() => {
        updatePullUI();
        rafIdRef.current = null;
      });
    };

    const stopSettlingSoon = () => {
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        setGestureState("IDLE");
        settleTimerRef.current = null;
      }, 360);
    };

    const snapBack = () => {
      const fromProgress = progressRef.current;
      pullDistanceRef.current = 0;
      progressRef.current = 0;
      thresholdReachedRef.current = false;
      setPullProgress(fromProgress);
      setGestureState("SNAPPING");
      stopSettlingSoon();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPullProgress(0));
      });
    };

    const triggerNext = () => {
      if (!nextSurah) return;
      router.push(`/surah/${nextSurah.surah}`);
    };

    const onTouchStart = (e: TouchEvent) => {
      computeAtBottom();
      if (!atBottomRef.current) return;
      if (e.touches.length !== 1) return;
      touchActiveRef.current = true;
      startYRef.current = e.touches[0].clientY;
      setGestureState("PULLING");
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchActiveRef.current || startYRef.current == null) return;
      computeAtBottom();
      if (!atBottomRef.current) return;
      const y = e.touches[0].clientY;
      const dy = y - startYRef.current;
      const rawPull = Math.max(0, Math.min(PULL_MAX_PX * 2, -dy)); // cap raw input to prevent infinite stretch
      if (rawPull < DEAD_ZONE_PX) return;
      if (rawPull > 0) e.preventDefault();
      const resisted = applyResistance(rawPull, PULL_MAX_PX);
      const progress = Math.min(1, resisted / THRESHOLD_PX);
      pullDistanceRef.current = resisted;
      progressRef.current = progress;
      if (progress >= 1 && !thresholdReachedRef.current) {
        thresholdReachedRef.current = true;
        setGestureState("THRESHOLD_REACHED");
      }
      flushRaf();
    };

    const onTouchEnd = () => {
      if (!touchActiveRef.current) return;
      touchActiveRef.current = false;
      startYRef.current = null;
      if (pullDistanceRef.current >= THRESHOLD_PX) triggerNext();
      else snapBack();
    };

    window.addEventListener("scroll", computeAtBottom, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    computeAtBottom();

    return () => {
      window.removeEventListener("scroll", computeAtBottom);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove as EventListener);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = null;
    };
  }, [nextSurah, router]);

  return (
    <>
      <StickyHeader
        title={title}
        subtitle={subtitle}
        backHref="/surahs"
        rightSlot={<SurahNav surahs={surahs} currentSurah={surah} />}
      />

      <main className="mx-auto w-full max-w-xl px-4 pb-24 pt-4 bg-app-bg">
        <div className="grid gap-3">
          {verses.map((v) => {
            const highlighted = highlightedAyah === v.ayah;
            return (
              <Verse
                key={v.ayah}
                surah={surah}
                ayah={v.ayah}
                text={v.text}
                highlighted={highlighted}
                highlightedPhrase={highlighted ? matchedPhrase ?? undefined : undefined}
                highlightedWordIndices={highlighted ? matchedWordIndices ?? undefined : undefined}
                isBookmarked={isBookmarked(surah, v.ayah)}
                onToggleBookmark={toggleBookmark}
                onTapVerse={handleTapVerse}
                isExpanded={expandedVerse?.surah === surah && expandedVerse?.ayah === v.ayah}
                meaning={expandedVerse?.surah === surah && expandedVerse?.ayah === v.ayah ? verseMeaning : null}
                meaningLoading={expandedVerse?.surah === surah && expandedVerse?.ayah === v.ayah ? verseMeaningLoading : false}
              />
            );
          })}
        </div>
      </main>

      {nextSurah && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 pointer-events-none w-full"
          aria-hidden
        >
          <div className="w-full pb-safe-b relative">
            <div
              className="absolute left-0 right-0 bottom-full w-full overflow-hidden bg-white/10 transition-opacity duration-200"
              style={{
                height: 2,
                opacity: gestureState === "IDLE" && pullProgress === 0 ? 0 : 1,
              }}
            >
              <div className="h-full w-full">
                <div
                  ref={progressFillRef}
                  className="h-full rounded-r-full bg-[#9B6DD4] origin-left"
                  style={{
                    transform: `scaleX(${pullProgress})`,
                    transition:
                      gestureState === "SNAPPING"
                        ? `transform 320ms ${EASE_SNAP_BACK}`
                        : "none",
                  }}
                />
              </div>
            </div>
            <div
              className="w-full border-t border-white/10 bg-app-bg pt-3 pb-3.5 px-4"
              style={{
                opacity: pullProgress,
                transition:
                  gestureState === "SNAPPING"
                    ? `opacity 320ms ${EASE_SNAP_BACK}`
                    : "none",
              }}
            >
              <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-white/50">
                    {gestureState === "THRESHOLD_REACHED"
                      ? "Release to open"
                      : "Next surah"}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 min-w-0 leading-[1.5]">
                    <span className="truncate text-[14px] font-semibold text-white">
                      {nextSurah.transliteration ?? `Surah ${nextSurah.surah}`}
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="truncate font-quran text-white/70 text-[13px] align-baseline pb-0.5" dir="rtl" lang="ar">
                      {nextSurah.name}
                    </span>
                  </div>
                </div>
                <div className="shrink-0 text-white/70 text-base">
                  ↑
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
