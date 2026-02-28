import { cn } from "@/lib/cn";

export function LoadingOverlay({
  show,
  label,
  dark,
}: {
  show: boolean;
  label: string;
  dark?: boolean;
}) {
  if (!show) return null;
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 grid place-items-center backdrop-blur-md transition-opacity duration-300",
        dark ? "bg-black/60" : "bg-ink-950/30",
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <div
        className={cn(
          "w-[min(92vw,360px)] rounded-3xl p-5 transition-transform duration-300",
          dark ? "bg-white/10 border border-white/20" : "bg-sand-50 shadow-soft",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "h-10 w-10 rounded-2xl grid place-items-center",
              dark ? "bg-white/20" : "bg-teal-500/15 shadow-ring",
            )}
          >
            <div
              className={cn(
                "h-4 w-4 animate-spin rounded-full border-2 border-t-transparent",
                dark ? "border-primary border-t-transparent" : "border-teal-600 border-t-transparent",
              )}
            />
          </div>
          <div>
            <div className={cn("text-sm font-semibold", dark ? "text-white" : "text-ink-950")}>
              {label}
            </div>
            <div className={cn("mt-0.5 text-xs", dark ? "text-white/70" : "text-ink-700")}>
              Please keep the app open.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

