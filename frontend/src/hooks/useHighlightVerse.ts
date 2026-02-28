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

  useEffect(() => {
    if (!targetAyah) return;
    const id = `verse-${surah}-${targetAyah}`;
    const el = document.getElementById(id);
    if (!el) return;

    // Let layout settle, then scroll smoothly.
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedAyah(targetAyah);
    }, 80);

    return () => window.clearTimeout(t);
  }, [surah, targetAyah]);

  // Remove highlight after 1s (matches CSS animation).
  useEffect(() => {
    if (highlightedAyah == null) return;
    const t = window.setTimeout(() => setHighlightedAyah(null), 1000);
    return () => window.clearTimeout(t);
  }, [highlightedAyah]);

  return { highlightedAyah };
}

