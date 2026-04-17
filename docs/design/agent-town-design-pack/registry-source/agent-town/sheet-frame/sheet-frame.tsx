import * as React from "react";
import { cn } from "@/lib/utils";

export interface SheetFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "right" | "bottom";
}

export function SheetFrame({ side = "right", className, children, ...props }: SheetFrameProps) {
  return (
    <aside
      className={cn(
        "at-parchment fixed z-50",
        side === "right" ? "right-4 top-4 h-[calc(100vh-2rem)] w-[min(420px,calc(100vw-2rem))]" : "bottom-0 left-0 right-0 max-h-[85vh] rounded-b-none",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
