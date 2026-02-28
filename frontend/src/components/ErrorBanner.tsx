import { cn } from "@/lib/cn";

export function ErrorBanner({
  message,
  className,
  dark,
}: {
  message: string;
  className?: string;
  dark?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm",
        dark
          ? "border-rose-400/30 bg-rose-500/20 text-white"
          : "border-rose-500/20 bg-rose-500/10 text-ink-950",
        className,
      )}
    >
      <div className="font-medium">Something went wrong</div>
      <div className={cn("mt-1", dark ? "text-white/90" : "text-ink-700")}>{message}</div>
    </div>
  );
}

