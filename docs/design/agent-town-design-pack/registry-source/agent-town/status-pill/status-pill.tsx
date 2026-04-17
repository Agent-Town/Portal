import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "good" | "wait" | "warn" | "bad";

const toneClass: Record<Tone, string> = {
  neutral: "bg-[var(--at-sand-100)] text-[var(--at-wood-950)] border-[var(--at-brass-700)]",
  good: "bg-[var(--at-teal-600)] text-[var(--at-cream-50)] border-[var(--at-wood-950)]",
  wait: "bg-[var(--at-ochre-500)] text-[var(--at-wood-950)] border-[var(--at-wood-950)]",
  warn: "bg-[var(--at-sun-200)] text-[var(--at-wood-950)] border-[var(--at-brass-700)]",
  bad: "bg-[var(--at-rust-600)] text-[var(--at-cream-50)] border-[var(--at-wood-950)]",
};

export function StatusPill({
  tone = "neutral",
  className,
  children,
}: React.PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border-2 px-3 py-1 text-xs font-medium", toneClass[tone], className)}>
      {children}
    </span>
  );
}
