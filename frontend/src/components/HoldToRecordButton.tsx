"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

const MIN_HOLD_MS = 400;

export function HoldToRecordButton({
  isRecording,
  level,
  disabled,
  onPressStart,
  onPressEnd,
  onPressCancel,
  size = "default",
}: {
  isRecording: boolean;
  level: number;
  disabled?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
  onPressCancel?: () => void;
  size?: "default" | "full";
}) {
  const activePointerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isRecording) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    activePointerRef.current = e.pointerId;
    holdStartRef.current = Date.now();
    onPressStart();
  };

  const endPress = (e: React.PointerEvent, submit: boolean) => {
    if (activePointerRef.current !== e.pointerId) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    activePointerRef.current = null;
    if (submit) onPressEnd();
    else onPressCancel?.();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    const held = Date.now() - holdStartRef.current;
    endPress(e, held >= MIN_HOLD_MS);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    const held = Date.now() - holdStartRef.current;
    endPress(e, held >= MIN_HOLD_MS);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (activePointerRef.current === e.pointerId) {
      activePointerRef.current = null;
      onPressCancel?.();
    }
  };

  const ringScale = 1 + Math.min(0.12, Math.max(0, level) * 0.15);
  const isFull = size === "full";

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerCancel={handlePointerCancel}
      className={cn(
        "relative select-none touch-none outline-none rounded-full",
        "focus-visible:ring-4 focus-visible:ring-white/20 focus-visible:ring-offset-4 focus-visible:ring-offset-shazam-bg",
        "disabled:opacity-60 disabled:pointer-events-none",
      )}
      style={{ touchAction: "manipulation" }}
      aria-label={isRecording ? "Recording—release to identify verse" : "Hold to identify a verse"}
      aria-pressed={isRecording}
    >
      {/* Outer pulse ring - fluid transition */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500 ease-out",
          isRecording ? "animate-record-glow bg-rose-500/25" : "bg-white/10",
        )}
        style={{
          transform: `scale(${isRecording ? 1.12 : ringScale})`,
          opacity: isRecording ? 1 : level > 0.03 ? 0.8 : 0,
        }}
      />
      {/* Main circle - Shazam style: white when idle (black icon), red when recording (white icon) */}
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-350 ease-out",
          isFull
            ? "w-[min(78vw,320px)] h-[min(78vw,320px)] max-w-[320px] max-h-[320px]"
            : "h-[160px] w-[160px]",
          isRecording
            ? "bg-rose-500 text-white shadow-shazam-glow animate-record-pulse"
            : "bg-white text-black shadow-shazam-btn active:scale-[0.98]",
          !isRecording && !disabled && "animate-idle-breathe",
        )}
      >
        <svg
          width={isFull ? 72 : 56}
          height={isFull ? 72 : 56}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="drop-shadow-sm"
          aria-hidden
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M19 11a7 7 0 0 1-14 0" />
          <path d="M12 18v3" />
        </svg>
      </span>
    </button>
  );
}
