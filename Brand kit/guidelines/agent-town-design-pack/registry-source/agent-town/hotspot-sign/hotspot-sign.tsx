import * as React from "react";
import { cn } from "@/lib/utils";

export interface HotspotSignProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

export function HotspotSign({ className, active = false, children, ...props }: HotspotSignProps) {
  return (
    <button
      className={cn(
        "at-hotspot-lift at-focusable rounded-[var(--at-radius-md)] border-2 border-[var(--at-wood-950)] bg-[var(--at-sand-100)] px-3 py-2 text-sm font-semibold text-[var(--at-wood-950)] shadow-[var(--at-shadow-panel)]",
        active && "bg-[var(--at-sun-200)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
