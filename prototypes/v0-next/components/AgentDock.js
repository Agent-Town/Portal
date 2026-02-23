'use client';

import { useState } from 'react';

export default function AgentDock() {
  const [open, setOpen] = useState(true);

  return (
    <section className="dock" data-testid="prototype-agent-dock">
      <div className="dockHead">
        <strong>Agent Worker Dock</strong>
        <div className="row">
          <span className="chip">session: active</span>
          <button className="btn" type="button" onClick={() => setOpen((v) => !v)}>
            {open ? 'Minimize' : 'Expand'}
          </button>
        </div>
      </div>
      {open ? (
        <div className="dockBody">
          <div className="chat">
            <strong>Comms</strong>
            <p className="small">Human + agent message stream, approvals, and co-op controls.</p>
            <div className="row">
              <input className="input" defaultValue="Message agent..." aria-label="Message" />
              <button className="btn" type="button">Send</button>
            </div>
          </div>
          <div className="logs">
            <strong>Debug Views</strong>
            <p className="small">Tools, skill context, worker traffic, brain, and session context tabs.</p>
            <div className="row">
              <span className="chip">tools</span>
              <span className="chip">traffic</span>
              <span className="chip">brain</span>
              <span className="chip">trainer</span>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
