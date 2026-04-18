import * as React from "react";
import { ParchmentPanel } from "@/components/ui/parchment-panel";

export interface TownHallOnboardingProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function TownHallOnboarding({ title, subtitle, children }: TownHallOnboardingProps) {
  return (
    <ParchmentPanel
      header={
        <div className="grid gap-1">
          <h2 className="font-[Rye] text-2xl">{title}</h2>
          {subtitle ? <p className="text-sm text-[var(--at-sun-200)]/90">{subtitle}</p> : null}
        </div>
      }
    >
      <div className="grid gap-5">{children}</div>
    </ParchmentPanel>
  );
}
