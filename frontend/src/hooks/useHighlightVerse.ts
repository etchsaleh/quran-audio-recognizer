"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

export function useHighlightVerse(surah: number) {
  const sp = useSearchParams();
  const targetAyah = useMemo(() => {
    const raw = sp.get("ayah");
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [sp]);

  const [highlightedAyah, setHighlightedAyah] = useState<number | null>(null);
  const [matchedPhrase, setMatchedPhrase] = useState<string | null>(null);

  useEffect(() => {
    if (!targetAyah) return;
    const id = `verse-${surah}-${targetAyah}`;
    const el = document.getElementById(id);
    if (!el) return;

    const phrase =
      typeof sessionStorage !== "undefined" ? sessionStorage.getItem("quran-matched-phrase") : null;
    if (phrase) {
      setMatchedPhrase(phrase);
      sessionStorage.removeItem("quran-matched-phrase");
    }

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting) {
          setHighlightedAyah(targetAyah);
          observer.disconnect();
        }
      },
      { threshold: 0.5, rootMargin: "0px" },
    );
    observer.observe(el);

    return () => observer.disconnect();
  }, [surah, targetAyah]);

  // Remove verse highlight after 1s; phrase highlight animates 2s via CSS.
  useEffect(() => {
    if (highlightedAyah == null) return;
    const t = window.setTimeout(() => {
      setHighlightedAyah(null);
      setMatchedPhrase(null);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [highlightedAyah]);

  return { highlightedAyah, matchedPhrase };
}
