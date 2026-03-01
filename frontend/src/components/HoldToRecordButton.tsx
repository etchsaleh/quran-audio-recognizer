"use client";

import { cn } from "@/lib/cn";

export type ButtonErrorState = "too_short" | "no_match" | null;

export function HoldToRecordButton({
  isRecording,
  identifying = false,
  identifyingShowsLoader = true,
  level,
  disabled,
  onTap,
  size = "default",
  errorState = null,
}: {
  isRecording: boolean;
  identifying?: boolean;
  /** When false, keep mic icon visible while identifying (e.g. main page listening). */
  identifyingShowsLoader?: boolean;
  level: number;
  disabled?: boolean;
  onTap: () => void;
  size?: "default" | "full";
  errorState?: ButtonErrorState;
}) {
  const active = isRecording || identifying;
  const isError = errorState != null;
  const showDots = identifying && identifyingShowsLoader;
  const ringScale = 1 + Math.min(0.2, Math.max(0, level) * 0.25);
  const isFull = size === "full";

  return (
    <button
      type="button"
      disabled={disabled && !isError}
      onClick={onTap}
      className={cn(
        "relative select-none outline-none rounded-full",
        "focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-4 focus-visible:ring-offset-app-bg",
        "disabled:opacity-60 disabled:pointer-events-none",
        isError && errorState === "no_match" && "animate-shake",
      )}
      style={{ touchAction: "manipulation" }}
      aria-label={
        isError
          ? errorState === "too_short"
            ? "Recording too short"
            : "Couldn’t identify"
          : identifying
            ? "Identifying verse…"
            : isRecording
              ? "Tap to stop and identify verse"
              : "Tap to start recording"
      }
      aria-pressed={isRecording}
      aria-busy={identifying}
      aria-invalid={isError}
    >
      {/* Expanding rings – hide when error */}
      {!isError &&
        [1, 2, 3].map((i) => {
          const baseScale = active ? (identifying ? 1.06 + i * 0.07 : ringScale + i * 0.05) : 1;
          const op = active ? (identifying ? 0.45 - i * 0.1 : 0.5 - i * 0.1 + level * 0.15) : 0;
          return (
            <span
              key={i}
              aria-hidden
              className={cn(
                "absolute inset-0 rounded-full pointer-events-none transition-transform duration-300 ease-out",
                "border-2 border-[#7C40C6]/50",
                active && identifying && "animate-ring-expand",
              )}
              style={{
                transform: `scale(${baseScale})`,
                opacity: op,
                ...(active && identifying && { animationDelay: `${i * 150}ms` }),
              }}
            />
          );
        })}
      {/* Outer glow – red when error */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500 ease-out",
          isError ? "bg-red-500/30" : active ? "animate-record-glow bg-[#7C40C6]/30" : "bg-white/10",
        )}
        style={{
          transform: `scale(${isError ? 1.08 : active ? 1.15 : ringScale})`,
          opacity: isError ? 1 : active ? 1 : level > 0.03 ? 0.8 : 0,
        }}
      />
      {/* Main circle – red when error, show ! for no_match; rotating dots when identifying */}
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-350 ease-out overflow-hidden",
          isFull
            ? "w-[min(78vw,320px)] h-[min(78vw,320px)] max-w-[320px] max-h-[320px]"
            : "h-[160px] w-[160px]",
          isError
            ? "bg-red-500 text-white shadow-lg"
            : active
              ? "text-white shadow-record-glow animate-record-pulse"
              : "bg-white text-black shadow-btn-soft active:scale-[0.98]",
          !active && !disabled && !isError && "animate-idle-breathe",
        )}
        style={!isError && active ? { backgroundColor: "#7C40C6" } : undefined}
      >
        {/* Mic icon – fades out when identifying and showing loader */}
        {!isError && (
          <span
            className={cn(
              "absolute flex items-center justify-center transition-all duration-300 ease-out",
              showDots ? "scale-90 opacity-0 pointer-events-none" : "scale-100 opacity-100",
            )}
            aria-hidden={showDots}
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
            >
              <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
              <path d="M19 11a7 7 0 0 1-14 0" />
              <path d="M12 18v3" />
            </svg>
          </span>
        )}
        {/* Chunky rotating dots (5) – replace mic when identifying and loader enabled */}
        <span
          className={cn(
            "absolute flex items-center justify-center transition-all duration-300 ease-out",
            showDots ? "scale-100 opacity-100" : "scale-90 opacity-0 pointer-events-none",
          )}
          aria-hidden={!showDots}
        >
          <span
            className="dots-rotate relative box-border"
            style={{
              width: isFull ? 56 : 44,
              height: isFull ? 56 : 44,
              minWidth: isFull ? 56 : 44,
              minHeight: isFull ? 56 : 44,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => {
              const deg = i * 72;
              const r = isFull ? 20 : 16;
              return (
                <span
                  key={i}
                  className="absolute left-1/2 top-1/2 rounded-full bg-white shadow-md"
                  style={{
                    width: isFull ? 14 : 12,
                    height: isFull ? 14 : 12,
                    marginLeft: isFull ? -7 : -6,
                    marginTop: isFull ? -7 : -6,
                    transform: `rotate(${deg}deg) translateY(-${r}px)`,
                  }}
                />
              );
            })}
          </span>
        </span>
        {isError && errorState === "no_match" && (
          <span
            className={cn(
              "font-black leading-none tracking-tighter",
              isFull ? "text-7xl" : "text-6xl",
            )}
            style={{ WebkitTextStroke: "2.5px currentColor" }}
            aria-hidden
          >
            !
          </span>
        )}
      </span>
    </button>
  );
}
