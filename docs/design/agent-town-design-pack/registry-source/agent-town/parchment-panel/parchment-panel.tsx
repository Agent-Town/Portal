import * as React from "react";
import { cn } from "@/lib/utils";

export interface ParchmentPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
}

export function ParchmentPanel({ className, header, children, ...props }: ParchmentPanelProps) {
  return (
    <section className={cn("at-parchment overflow-hidden", className)} {...props}>
      {header ? <header className="at-wood-header px-5 py-4">{header}</header> : null}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}
