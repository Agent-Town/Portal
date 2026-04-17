import * as React from "react";
import { BrassButton } from "@/components/ui/brass-button";
import { StatusPill } from "@/components/ui/status-pill";

export interface SigilLockStepProps {
  status: "locked" | "waiting" | "ready";
  detail: string;
  children?: React.ReactNode;
  onOpen?: () => void;
}

export function SigilLockStep({ status, detail, children, onOpen }: SigilLockStepProps) {
  const tone = status === "ready" ? "good" : status === "waiting" ? "wait" : "bad";
  return (
    <section className="at-parchment grid gap-4 p-5">
      <div className="grid gap-2">
        <h3 className="font-[Rye] text-2xl text-[var(--at-wood-950)]">Sigil Test</h3>
        <p className="text-sm text-[var(--at-wood-950)]/85">You pick a sigil. The worker mirrors it. If both match, the lock opens.</p>
      </div>
      {children}
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone={tone}>{status.toUpperCase()}</StatusPill>
        <p className="text-sm text-[var(--at-wood-950)]/85">{detail}</p>
      </div>
      <div>
        <BrassButton variant="primary" onClick={onOpen}>Open</BrassButton>
      </div>
    </section>
  );
}
