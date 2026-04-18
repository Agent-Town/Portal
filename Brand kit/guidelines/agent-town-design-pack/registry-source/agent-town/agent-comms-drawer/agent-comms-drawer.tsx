import * as React from "react";
import { SheetFrame } from "@/components/ui/sheet-frame";
import { StatusPill } from "@/components/ui/status-pill";

export interface AgentCommsDrawerProps {
  status: string;
  recommendation?: string;
  approvalsSlot?: React.ReactNode;
  transcriptSlot?: React.ReactNode;
  debugSlot?: React.ReactNode;
}

export function AgentCommsDrawer({
  status,
  recommendation,
  approvalsSlot,
  transcriptSlot,
  debugSlot,
}: AgentCommsDrawerProps) {
  return (
    <SheetFrame side="right" className="grid grid-rows-[auto_auto_1fr_auto] gap-4 p-4">
      <header className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-[Rye] text-xl text-[var(--at-wood-950)]">Agent Comms</h3>
          <StatusPill tone="neutral">{status}</StatusPill>
        </div>
        {recommendation ? <p className="text-sm text-[var(--at-wood-950)]/85">{recommendation}</p> : null}
      </header>
      {approvalsSlot}
      <section className="overflow-auto">{transcriptSlot}</section>
      {debugSlot ? (
        <details className="rounded-[var(--at-radius-md)] border-2 border-[var(--at-brass-700)] bg-[var(--at-cream-50)] p-3">
          <summary className="cursor-pointer text-sm font-semibold text-[var(--at-wood-950)]">Advanced / debug</summary>
          <div className="mt-3">{debugSlot}</div>
        </details>
      ) : null}
    </SheetFrame>
  );
}
