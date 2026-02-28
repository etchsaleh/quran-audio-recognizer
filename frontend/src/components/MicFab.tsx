"use client";

import { cn } from "@/lib/cn";

export function MicFab({
  recording,
  disabled,
  onClick,
}: {
  recording: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className="fixed z-50 flex items-end justify-end"
      style={{
        right: "max(1rem, env(safe-area-inset-right))",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={recording}
        aria-label={recording ? "Tap to stop and identify" : "Tap to record"}
        className={cn(
          "relative grid h-14 w-14 place-items-center rounded-full transition-all duration-300",
          "active:scale-95 disabled:opacity-50 disabled:active:scale-100",
          recording
            ? "text-white shadow-lg"
            : "border text-white",
        )}
        style={
          recording
            ? { backgroundColor: "#7C40C6", boxShadow: "0 10px 30px rgba(124,64,198,0.4)" }
            : { backgroundColor: "rgba(124,64,198,0.2)", borderColor: "rgba(124,64,198,0.5)" }
        }
      >
        <svg
          width={22}
          height={22}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Z" />
          <path d="M19 11a7 7 0 0 1-14 0" />
          <path d="M12 18v3" />
        </svg>
      </button>
    </div>
  );
}
