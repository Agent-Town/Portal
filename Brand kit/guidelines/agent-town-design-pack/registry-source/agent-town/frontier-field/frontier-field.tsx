import * as React from "react";
import { cn } from "@/lib/utils";

export interface FrontierFieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

export function FrontierField({ label, hint, children, className }: FrontierFieldProps) {
  return (
    <label className={cn("grid gap-2", className)}>
      <span className="text-sm font-medium text-[var(--at-wood-950)]">{label}</span>
      {hint ? <span className="text-xs text-[var(--at-wood-950)]/80">{hint}</span> : null}
      {children}
    </label>
  );
}
