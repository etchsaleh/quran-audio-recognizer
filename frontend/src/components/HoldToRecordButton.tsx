"use client";

import { cn } from "@/lib/cn";

export function HoldToRecordButton({
  isRecording,
  level,
  disabled,
  onTap,
  size = "default",
}: {
  isRecording: boolean;
  level: number;
  disabled?: boolean;
  onTap: () => void;
  size?: "default" | "full";
}) {
  const ringScale = 1 + Math.min(0.12, Math.max(0, level) * 0.15);
  const isFull = size === "full";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onTap}
      className={cn(
        "relative select-none outline-none rounded-full",
        "focus-visible:ring-4 focus-visible:ring-primary/30 focus-visible:ring-offset-4 focus-visible:ring-offset-app-bg",
        "disabled:opacity-60 disabled:pointer-events-none",
      )}
      style={{ touchAction: "manipulation" }}
      aria-label={isRecording ? "Tap to stop and identify verse" : "Tap to start recording"}
      aria-pressed={isRecording}
    >
      {/* Outer pulse ring when recording or level */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full transition-all duration-500 ease-out",
          isRecording ? "animate-record-glow bg-[#7C40C6]/30" : "bg-white/10",
        )}
        style={{
          transform: `scale(${isRecording ? 1.12 : ringScale})`,
          opacity: isRecording ? 1 : level > 0.03 ? 0.8 : 0,
        }}
      />
      {/* Main circle: white idle, purple when recording */}
      <span
        className={cn(
          "flex items-center justify-center rounded-full transition-all duration-350 ease-out",
          isFull
            ? "w-[min(78vw,320px)] h-[min(78vw,320px)] max-w-[320px] max-h-[320px]"
            : "h-[160px] w-[160px]",
          isRecording
            ? "text-white shadow-record-glow animate-record-pulse"
            : "bg-white text-black shadow-btn-soft active:scale-[0.98]",
          !isRecording && !disabled && "animate-idle-breathe",
        )}
        style={isRecording ? { backgroundColor: "#7C40C6" } : undefined}
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
