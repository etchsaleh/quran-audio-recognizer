"use client";

import { cn } from "@/lib/cn";

export function MicFab({
  recording,
  disabled,
  level,
  onClick,
  statusText,
}: {
  recording: boolean;
  disabled?: boolean;
  level: number;
  statusText?: string;
  onClick: () => void;
}) {
  const ringScale = 1 + Math.min(0.22, Math.max(0, level) * 0.35);

  return (
    <div
      className="fixed z-50 flex items-end justify-end"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div className="pointer-events-auto flex flex-col items-end">
            <button
              type="button"
              onClick={onClick}
              disabled={disabled}
              aria-pressed={recording}
              aria-label={recording ? "Stop listening" : "Start listening"}
              className={cn(
                "relative grid h-14 w-14 place-items-center rounded-2xl transition-all duration-300",
                "active:scale-95 disabled:opacity-50 disabled:active:scale-100",
                recording
                  ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30"
                  : "bg-white/15 border border-white/20 text-white hover:bg-white/25",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 rounded-[26px] bg-white/20",
                  recording ? "animate-pulse" : "",
                )}
                style={{ transform: `scale(${ringScale})`, opacity: recording ? 0.45 : 0.0 }}
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19 11a7 7 0 0 1-14 0"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 18v3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
      {statusText ? (
        <div className="mt-2 text-right text-[11px] font-medium text-white/70 max-w-[140px]">
          {statusText}
        </div>
      ) : null}
      </div>
    </div>
  );
}

