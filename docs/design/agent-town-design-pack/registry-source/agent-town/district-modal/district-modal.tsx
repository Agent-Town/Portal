import * as React from "react";
import { ParchmentPanel } from "@/components/ui/parchment-panel";
import { BrassButton } from "@/components/ui/brass-button";

export interface DistrictModalProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
}

export function DistrictModal({ title, onClose, children }: DistrictModalProps) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(46,27,14,0.35)] p-4">
      <ParchmentPanel
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden"
        header={
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-[Rye] text-2xl">{title}</h2>
            <BrassButton onClick={onClose} aria-label="Close district">Close</BrassButton>
          </div>
        }
      >
        <div className="max-h-[72vh] overflow-auto">{children}</div>
      </ParchmentPanel>
    </div>
  );
}
