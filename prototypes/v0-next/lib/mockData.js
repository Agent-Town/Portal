export const DISTRICTS = [
  {
    id: 'ethereum',
    name: 'Ethereum + Sepolia',
    family: 'EVM',
    agentCount: 18240,
    serviceCount: 1210,
    x: '14%',
    y: '20%',
    scene: 'sandstone exchange district with brass rails and sky tram'
  },
  {
    id: 'base',
    name: 'Base + Base Sepolia',
    family: 'EVM',
    agentCount: 6350,
    serviceCount: 820,
    x: '38%',
    y: '17%',
    scene: 'blue steel workshop quarter with relay towers'
  },
  {
    id: 'bnb',
    name: 'BNB + Chapel',
    family: 'EVM',
    agentCount: 3420,
    serviceCount: 410,
    x: '62%',
    y: '23%',
    scene: 'gold market street with lantern canopies'
  },
  {
    id: 'polygon',
    name: 'Polygon + Amoy',
    family: 'EVM',
    agentCount: 2910,
    serviceCount: 280,
    x: '21%',
    y: '56%',
    scene: 'terraced canyon district with rope bridges'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum + Sepolia',
    family: 'EVM',
    agentCount: 2270,
    serviceCount: 350,
    x: '49%',
    y: '52%',
    scene: 'clockwork rail junction with mirrored saloons'
  },
  {
    id: 'solana',
    name: 'Solana Devnet',
    family: 'Solana',
    agentCount: 1991,
    serviceCount: 310,
    x: '74%',
    y: '55%',
    scene: 'sunlit crystal harbor with kinetic docks'
  }
];

export const STOREFRONTS = [
  {
    id: 'evm:1:101',
    districtId: 'ethereum',
    chain: 'Ethereum',
    name: 'Proof Ranger',
    summary: 'Verifies signed payloads and emits attestations for downstream apps.',
    quality: 0.92,
    services: ['verify', 'attest', 'webhook'],
    endpoint: 'https://proof-ranger.example/api',
    avatar: '/fixtures/avatars/proof-ranger.png'
  },
  {
    id: 'evm:1:102',
    districtId: 'ethereum',
    chain: 'Ethereum',
    name: 'Ledger Marshal',
    summary: 'Monitors contract events and publishes compliance digest every hour.',
    quality: 0.89,
    services: ['events', 'digest'],
    endpoint: 'https://ledger-marshal.example/api',
    avatar: '/fixtures/avatars/ledger-marshal.png'
  },
  {
    id: 'evm:8453:56',
    districtId: 'base',
    chain: 'Base',
    name: 'Signal Sheriff',
    summary: 'Routes intent bundles to preferred liquidity sources.',
    quality: 0.86,
    services: ['routing', 'quote'],
    endpoint: 'https://signal-sheriff.example/api',
    avatar: '/fixtures/avatars/signal-sheriff.png'
  },
  {
    id: 'evm:8453:57',
    districtId: 'base',
    chain: 'Base',
    name: 'Claim Courier',
    summary: 'Creates pre-registration claims and wallet-bound invitation proofs.',
    quality: 0.84,
    services: ['invite', 'claim'],
    endpoint: 'https://claim-courier.example/api',
    avatar: '/fixtures/avatars/claim-courier.png'
  },
  {
    id: 'evm:56:88',
    districtId: 'bnb',
    chain: 'BNB',
    name: 'Fee Wrangler',
    summary: 'Predicts gas windows and batches outbound writes.',
    quality: 0.81,
    services: ['gas', 'batch'],
    endpoint: 'https://fee-wrangler.example/api',
    avatar: '/fixtures/avatars/fee-wrangler.png'
  },
  {
    id: 'evm:137:91',
    districtId: 'polygon',
    chain: 'Polygon',
    name: 'Mosaic Foreman',
    summary: 'Builds media manifests for share pages and OG payloads.',
    quality: 0.79,
    services: ['media', 'manifest'],
    endpoint: 'https://mosaic-foreman.example/api',
    avatar: '/fixtures/avatars/mosaic-foreman.png'
  },
  {
    id: 'evm:42161:77',
    districtId: 'arbitrum',
    chain: 'Arbitrum',
    name: 'Route Prospector',
    summary: 'Discovers resilient failover routes for agent endpoint traffic.',
    quality: 0.87,
    services: ['routing', 'health', 'failover'],
    endpoint: 'https://route-prospector.example/api',
    avatar: '/fixtures/avatars/route-prospector.png'
  },
  {
    id: 'solana:devnet:214',
    districtId: 'solana',
    chain: 'Solana Devnet',
    name: 'Dock Cartographer',
    summary: 'Indexes on-chain metadata and semantic tags for storefront discovery.',
    quality: 0.91,
    services: ['index', 'semantic-search'],
    endpoint: 'https://dock-cartographer.example/api',
    avatar: '/fixtures/avatars/dock-cartographer.png'
  },
  {
    id: 'solana:devnet:215',
    districtId: 'solana',
    chain: 'Solana Devnet',
    name: 'Pulse Watchtower',
    summary: 'Pings service endpoints weekly and computes uptime confidence.',
    quality: 0.93,
    services: ['ping', 'quality-score'],
    endpoint: 'https://pulse-watchtower.example/api',
    avatar: '/fixtures/avatars/pulse-watchtower.png'
  }
];

export const LEADERBOARD_ROWS = [
  { id: 't1', team: 'Dusty Coders', chain: 'Ethereum', referrals: 123, views: 931 },
  { id: 't2', team: 'Mojave Agents', chain: 'Base', referrals: 96, views: 740 },
  { id: 't3', team: 'Railroad Minds', chain: 'Solana', referrals: 72, views: 689 },
  { id: 't4', team: 'Copper Valley', chain: 'Polygon', referrals: 48, views: 422 }
];

export const TRAINER_ATTEMPTS = [
  { id: 'a-201', status: 'pass', score: 0.94, runAt: '2026-02-23T09:10:00Z' },
  { id: 'a-200', status: 'pass', score: 0.91, runAt: '2026-02-23T09:02:00Z' },
  { id: 'a-199', status: 'fail', score: 0.62, runAt: '2026-02-23T08:50:00Z' }
];

export function getDistrictById(id) {
  return DISTRICTS.find((district) => district.id === id) || null;
}

export function getStorefrontsByDistrict(districtId) {
  return STOREFRONTS.filter((entry) => entry.districtId === districtId);
}

export function searchStorefronts(query, districtId = '') {
  const q = query.trim().toLowerCase();
  return STOREFRONTS.filter((entry) => {
    if (districtId && entry.districtId !== districtId) return false;
    if (!q) return true;
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.summary.toLowerCase().includes(q) ||
      entry.chain.toLowerCase().includes(q) ||
      entry.services.join(' ').toLowerCase().includes(q)
    );
  });
}
