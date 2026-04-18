import * as React from "react";
import { ParchmentPanel } from "@/components/ui/parchment-panel";
import { BrassButton } from "@/components/ui/brass-button";

export interface BrainConnectPanelProps {
  easyPathSlot?: React.ReactNode;
  advancedSlot?: React.ReactNode;
  onContinue?: () => void;
}

export function BrainConnectPanel({ easyPathSlot, advancedSlot, onContinue }: BrainConnectPanelProps) {
  return (
    <ParchmentPanel
      header={
        <div className="grid gap-1">
          <h2 className="font-[Rye] text-2xl">Give your agent a brain</h2>
          <p className="text-sm text-[var(--at-sun-200)]/90">Start simple. Open advanced settings only if you need them.</p>
        </div>
      }
    >
      <div className="grid gap-5">
        <section className="grid gap-3">{easyPathSlot}</section>
        <details className="rounded-[var(--at-radius-md)] border-2 border-[var(--at-brass-700)] bg-[var(--at-cream-50)] p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--at-wood-950)]">I have my own API key / advanced setup</summary>
          <div className="mt-4 grid gap-4">{advancedSlot}</div>
        </details>
        <div>
          <BrassButton variant="primary" onClick={onContinue}>Continue</BrassButton>
        </div>
      </div>
    </ParchmentPanel>
  );
}
