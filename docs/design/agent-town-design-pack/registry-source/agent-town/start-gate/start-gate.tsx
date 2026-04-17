import * as React from "react";
import { ParchmentPanel } from "@/components/ui/parchment-panel";
import { BrassButton } from "@/components/ui/brass-button";

export interface StartGateProps {
  title: string;
  onEnter?: () => void;
  status?: string;
  authSlot?: React.ReactNode;
  heroSlot?: React.ReactNode;
}

export function StartGate({ title, onEnter, status, authSlot, heroSlot }: StartGateProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(180deg,var(--at-sky-100),var(--at-sand-100))] p-4">
      <ParchmentPanel className="w-full max-w-5xl">
        <div className="grid gap-6 p-4 md:grid-cols-[1.2fr_0.8fr]">
          <section className="grid gap-5">
            {heroSlot}
            <div className="grid gap-3">
              <h1 className="font-[Rye] text-4xl text-[var(--at-wood-950)] md:text-5xl">{title}</h1>
              <div>
                <BrassButton variant="primary" onClick={onEnter}>Enter</BrassButton>
              </div>
              {status ? <p className="text-sm text-[var(--at-wood-950)]/80">{status}</p> : null}
            </div>
          </section>
          <section className="grid content-start gap-4">{authSlot}</section>
        </div>
      </ParchmentPanel>
    </main>
  );
}
