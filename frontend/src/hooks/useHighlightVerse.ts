"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

const SCROLL_DURATION_MS = 380;
const HEADER_OFFSET = 80;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function smoothScrollToVerseElement(el: HTMLElement) {
  const startY = window.scrollY;
  const rect = el.getBoundingClientRect();
  const targetY = startY + rect.top - HEADER_OFFSET;
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const t = Math.min(elapsed / SCROLL_DURATION_MS, 1);
    const eased = easeOutCubic(t);
    window.scrollTo(0, startY + (targetY - startY) * eased);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

export function useHighlightVerse(surah: number) {
  const sp = useSearchParams();
  const targetAyah = useMemo(() => {
    const raw = sp.get("ayah");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [sp]);

  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [matchedPhrase, setMatchedPhrase] = useState<string | null>(null);
  const [matchedWordIndices, setMatchedWordIndices] = useState<number[] | null>(null);

  useEffect(() => {
    if (!targetAyah) return;
    const id = `verse-${surah}-${targetAyah}`;

    if (typeof sessionStorage !== "undefined") {
      const phrase = sessionStorage.getItem("quran-matched-phrase");
      if (phrase) {
        setMatchedPhrase(phrase);
        sessionStorage.removeItem("quran-matched-phrase");
      }
      const raw = sessionStorage.getItem("quran-matched-word-indices");
      if (raw) {
        try {
          const arr = JSON.parse(raw) as number[];
          if (Array.isArray(arr)) setMatchedWordIndices(arr);
        } catch {
          // ignore
        }
        sessionStorage.removeItem("quran-matched-word-indices");
      }
    }

    setHighlightedAyah(targetAyah);
    const el = document.getElementById(id);
    if (el) {
      smoothScrollToVerseElement(el);
    } else {
      requestAnimationFrame(() => {
        const el2 = document.getElementById(id);
        if (el2) smoothScrollToVerseElement(el2);
      });
    }
  }, [surah, targetAyah]);

  // Remove verse highlight after 2s; phrase highlight animates 2s via CSS.
  useEffect(() => {
    if (highlightedAyah == null) return;
    const t = window.setTimeout(() => {
      setHighlightedAyah(null);
      setMatchedPhrase(null);
      setMatchedWordIndices(null);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [highlightedAyah]);

  return { highlightedAyah, matchedPhrase, matchedWordIndices };
}
