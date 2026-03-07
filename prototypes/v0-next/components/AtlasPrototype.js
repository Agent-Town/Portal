'use client';

import { useMemo, useState } from 'react';
import {
  DISTRICTS,
  getDistrictById,
  getStorefrontsByDistrict,
  searchStorefronts
} from '../lib/mockData';

function districtScale(agentCount) {
  const base = Math.log10(Math.max(agentCount, 10));
  return Math.max(1, Math.round(base * 1.4));
}

export default function AtlasPrototype() {
  const [query, setQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [activeDistrict, setActiveDistrict] = useState('ethereum');
  const [selectedStorefrontId, setSelectedStorefrontId] = useState('');

  const filteredStorefronts = useMemo(
    () => searchStorefronts(query, districtFilter),
    [query, districtFilter]
  );

  const activeStorefront = useMemo(() => {
    if (!selectedStorefrontId) return null;
    return filteredStorefronts.find((entry) => entry.id === selectedStorefrontId) || null;
  }, [filteredStorefronts, selectedStorefrontId]);

  const activeDistrictData = getDistrictById(activeDistrict);
  const districtAgents = getStorefrontsByDistrict(activeDistrict);

  return (
    <section className="atlasGrid">
      <div className="panel">
        <h1 style={{ marginTop: 0 }}>Atlas District Map</h1>
        <p className="small" style={{ marginTop: 0 }}>
          Log-scaled districts by chain + testnet pair, with storefront drawer and opt-out pattern.
        </p>

        <div className="row" style={{ marginBottom: 10 }}>
          <label className="small" htmlFor="atlas-search">Search</label>
          <input
            id="atlas-search"
            className="input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="service, chain, agent"
            style={{ maxWidth: 280 }}
          />
          <label className="small" htmlFor="atlas-district">District</label>
          <select
            id="atlas-district"
            className="input"
            value={districtFilter}
            onChange={(event) => setDistrictFilter(event.target.value)}
            style={{ maxWidth: 220 }}
          >
            <option value="">All districts</option>
            {DISTRICTS.map((district) => (
              <option key={district.id} value={district.id}>
                {district.name}
              </option>
            ))}
          </select>
        </div>

        <div className="atlasMap" role="img" aria-label="Atlas district graph">
          {DISTRICTS.map((district) => (
            <button
              key={district.id}
              className="atlasNode"
              style={{
                left: district.x,
                top: district.y,
                transform: `scale(${districtScale(district.agentCount) / 3.5})`
              }}
              type="button"
              onClick={() => setActiveDistrict(district.id)}
            >
              <strong>{district.name}</strong>
              <div className="small">Agents: {district.agentCount.toLocaleString()}</div>
            </button>
          ))}
        </div>

        <div className="panel" style={{ marginTop: 10, padding: 10 }}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <strong>{activeDistrictData ? activeDistrictData.name : 'District'}</strong>
            <span className="chip">service-like: {activeDistrictData?.serviceCount.toLocaleString() || 0}</span>
          </div>
          <p className="small">Scene seed: {activeDistrictData?.scene || 'n/a'}</p>
          <div className="listCompact">
            {districtAgents.map((entry) => (
              <div className="listRow" key={entry.id}>
                <strong>{entry.name}</strong>
                <button className="btn" type="button" onClick={() => setSelectedStorefrontId(entry.id)}>
                  Open storefront
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <aside className="panel">
        <h2 style={{ marginTop: 0 }}>Storefront Market</h2>
        <div className="small">Results: {filteredStorefronts.length}</div>
        <div className="market" style={{ marginTop: 8 }}>
          {filteredStorefronts.map((entry) => (
            <button
              type="button"
              className="marketCard"
              key={entry.id}
              onClick={() => setSelectedStorefrontId(entry.id)}
            >
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{entry.name}</strong>
                <span className="chip">{entry.chain}</span>
              </div>
              <div className="small">{entry.summary}</div>
              <div className="row">
                {entry.services.map((service) => (
                  <span className="chip" key={`${entry.id}-${service}`}>
                    {service}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {activeStorefront ? (
        <div className="modalBackdrop" role="presentation">
          <section className="modal" role="dialog" aria-label="Storefront drawer">
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <strong>{activeStorefront.name}</strong>
              <button className="btn" type="button" onClick={() => setSelectedStorefrontId('')}>
                Close
              </button>
            </div>
            <div className="gridTwo">
              <div className="panel" style={{ margin: 0 }}>
                <div className="small">Agent ID</div>
                <code>{activeStorefront.id}</code>
                <p className="small" style={{ marginBottom: 0 }}>{activeStorefront.summary}</p>
                <p className="small" style={{ marginTop: 6 }}>
                  Endpoint: <code>{activeStorefront.endpoint}</code>
                </p>
              </div>
              <div className="panel" style={{ margin: 0 }}>
                <div className="small">Actions</div>
                <div className="row">
                  <button className="btn" type="button">Preview service products</button>
                  <button className="btn">Open share hero</button>
                  <button className="btn bad" type="button">Opt out request</button>
                </div>
                <p className="small" style={{ marginBottom: 0 }}>
                  Opt-out flow should require ERC-8004 ownership signature and soft-delete the pre-registered house.
                </p>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
