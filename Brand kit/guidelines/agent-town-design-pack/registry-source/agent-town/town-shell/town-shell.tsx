import * as React from "react";
import { HotspotSign } from "@/components/ui/hotspot-sign";

export interface TownShellHotspot {
  id: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export interface TownShellProps {
  status: string;
  hotspots: TownShellHotspot[];
  backdropSlot?: React.ReactNode;
  overlaySlot?: React.ReactNode;
}

export function TownShell({ status, hotspots, backdropSlot, overlaySlot }: TownShellProps) {
  return (
    <section className="grid gap-3">
      <div className="relative overflow-hidden rounded-[var(--at-radius-lg)] border-2 border-[var(--at-wood-950)] bg-[linear-gradient(180deg,var(--at-sky-100),var(--at-sand-100))] p-4 shadow-[var(--at-shadow-panel)]">
        {backdropSlot}
        <div className="relative z-10 grid min-h-[420px] content-between gap-8">
          <div />
          <div className="flex flex-wrap gap-3">
            {hotspots.map((hotspot) => (
              <HotspotSign key={hotspot.id} active={hotspot.active} onClick={hotspot.onClick}>
                {hotspot.label}
              </HotspotSign>
            ))}
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--at-wood-950)]">{status}</p>
      {overlaySlot}
    </section>
  );
}
