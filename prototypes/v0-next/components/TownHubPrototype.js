'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { DISTRICTS, getStorefrontsByDistrict } from '../lib/mockData';

const DISTRICT_DETAILS = {
  house: {
    title: 'Plan Wagons',
    body: 'Unlock and manage your house, claim flow, media slots, and referral share assets.',
    links: [
      { href: '/house', label: 'Open House' },
      { href: '/share/demo-house', label: 'Open Share Demo' }
    ]
  },
  leaderboard: {
    title: 'Town Board',
    body: 'Browse active teams, referral activity, and service storefront momentum.',
    links: [{ href: '/leaderboard', label: 'Open Leaderboard' }]
  },
  atlas: {
    title: 'Atlas District Map',
    body: 'Explore chain districts, service storefronts, and opt-out controls for ERC-8004 entries.',
    links: [{ href: '/atlas', label: 'Open Atlas' }]
  },
  trainer: {
    title: 'Experience Trainer',
    body: 'Replay UX journeys with deterministic runs and inspect tool traces.',
    links: [{ href: '/trainer', label: 'Open Trainer' }]
  }
};

const HOTSPOTS = [
  { id: 'leaderboard', label: 'Town Board', left: '18%', top: '22%' },
  { id: 'atlas', label: 'Atlas Depot', left: '52%', top: '18%' },
  { id: 'house', label: 'Plan Wagons', left: '24%', top: '58%' },
  { id: 'trainer', label: 'Trainer Hall', left: '62%', top: '56%' }
];

export default function TownHubPrototype() {
  const [districtOpen, setDistrictOpen] = useState('house');
  const [districtModalOpen, setDistrictModalOpen] = useState(false);
  const [trainerOpen, setTrainerOpen] = useState(false);

  const detail = DISTRICT_DETAILS[districtOpen] || DISTRICT_DETAILS.house;

  const mapSummary = useMemo(() => {
    const totalAgents = DISTRICTS.reduce((sum, district) => sum + district.agentCount, 0);
    const totalServices = DISTRICTS.reduce((sum, district) => sum + district.serviceCount, 0);
    return { totalAgents, totalServices };
  }, []);

  const highlightedAgents = useMemo(() => {
    if (districtOpen !== 'atlas') return [];
    return DISTRICTS.flatMap((district) => getStorefrontsByDistrict(district.id)).slice(0, 4);
  }, [districtOpen]);

  return (
    <>
      <section className="townGrid">
        <div className="panel">
          <h1 style={{ marginTop: 0 }}>Town Hub Prototype</h1>
          <p className="small" style={{ marginTop: 0 }}>
            One-screen navigation model with district modals, trainer modal, and persistent agent dock.
          </p>

          <div className="townMap" aria-label="District map prototype">
            {HOTSPOTS.map((spot) => (
              <button
                key={spot.id}
                className="districtHotspot"
                style={{ left: spot.left, top: spot.top }}
                type="button"
                onClick={() => {
                  setDistrictOpen(spot.id);
                  setDistrictModalOpen(true);
                }}
              >
                {spot.label}
              </button>
            ))}
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <span className="chip">districts: {DISTRICTS.length}</span>
            <span className="chip">agents: {mapSummary.totalAgents.toLocaleString()}</span>
            <span className="chip">service-like: {mapSummary.totalServices.toLocaleString()}</span>
          </div>
        </div>

        <aside className="panel townSidePanel">
          <h2 style={{ marginTop: 0 }}>Current District</h2>
          <strong>{detail.title}</strong>
          <p className="small">{detail.body}</p>
          <div className="row">
            {detail.links.map((item) => (
              <Link className="btn" key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <button className="btn" type="button" onClick={() => setDistrictModalOpen(true)}>
              Open District Modal
            </button>
            <button className="btn" type="button" onClick={() => setTrainerOpen(true)}>
              Open Trainer Modal
            </button>
          </div>
          {districtOpen === 'atlas' ? (
            <div className="panel" style={{ marginTop: 10, padding: 10 }}>
              <div className="small">Featured storefronts</div>
              <div className="listCompact">
                {highlightedAgents.map((agent) => (
                  <div className="listRow" key={agent.id}>
                    <strong>{agent.name}</strong>
                    <span className="small">{agent.chain}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      {districtModalOpen ? (
        <div className="modalBackdrop" role="presentation">
          <div className="modal" role="dialog" aria-label="District detail">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{detail.title}</strong>
              <button className="btn" type="button" onClick={() => setDistrictModalOpen(false)}>
                Close
              </button>
            </div>
            <p className="small">{detail.body}</p>
            <div className="row">
              {detail.links.map((item) => (
                <Link className="btn" key={`modal-${item.href}`} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <button className="btn" type="button" onClick={() => setTrainerOpen(true)}>
                Trainer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {trainerOpen ? (
        <div className="modalBackdrop" role="presentation">
          <section className="modal" role="dialog" aria-label="Trainer modal prototype">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>Experience Trainer</strong>
              <button className="btn" type="button" onClick={() => setTrainerOpen(false)}>
                Close
              </button>
            </div>
            <div className="gridTwo">
              <div className="panel" style={{ margin: 0 }}>
                <div className="small">Attempts</div>
                <div className="listCompact">
                  <div className="listRow"><strong>a-201</strong><span className="chip">pass</span></div>
                  <div className="listRow"><strong>a-200</strong><span className="chip">pass</span></div>
                  <div className="listRow"><strong>a-199</strong><span className="chip">fail</span></div>
                </div>
              </div>
              <div className="panel" style={{ margin: 0 }}>
                <div className="small">Debug tabs</div>
                <div className="row">
                  <span className="chip">Trace</span>
                  <span className="chip">Tools</span>
                  <span className="chip">Traffic</span>
                  <span className="chip">Brain</span>
                </div>
                <p className="small">Mirror of the existing trainer shell for styling experiments.</p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
