import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

export interface BrassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variantClass: Record<Variant, string> = {
  primary: "bg-[var(--at-teal-600)] text-[var(--at-cream-50)] border-[var(--at-wood-950)]",
  secondary: "bg-[var(--at-sand-100)] text-[var(--at-wood-950)] border-[var(--at-brass-700)]",
  danger: "bg-[var(--at-rust-600)] text-[var(--at-cream-50)] border-[var(--at-wood-950)]",
  ghost: "bg-transparent text-[var(--at-wood-950)] border-transparent",
};

export function BrassButton({ className, variant = "secondary", ...props }: BrassButtonProps) {
  return (
    <button
      className={cn(
        "at-focusable rounded-[var(--at-radius-md)] border-2 px-4 py-2 text-sm font-semibold transition-transform duration-150 ease-out hover:-translate-y-px",
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}
