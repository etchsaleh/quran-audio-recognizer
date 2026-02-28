import type React from "react";
import Link from "next/link";

export function StickyHeader({
  title,
  subtitle,
  backHref = "/",
  rightSlot,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightSlot?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-app-bg/95 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex w-full max-w-xl items-center gap-3 px-4 py-3">
        <Link
          href={backHref}
          className="grid h-10 w-10 place-items-center rounded-2xl bg-app-surface text-white transition-[transform,background] duration-300 active:scale-95 active:bg-white/10"
          aria-label="Back"
        >
          <span className="text-lg leading-none">←</span>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{title}</div>
          {subtitle ? <div className="truncate text-xs text-white/60">{subtitle}</div> : null}
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </header>
  );
}

