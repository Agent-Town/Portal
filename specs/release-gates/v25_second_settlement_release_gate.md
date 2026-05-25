# V2.5 Second Settlement Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V25_SECOND_SETTLEMENT`.

## Product Gate

- First town stability criteria are understandable before launch.
- Governor Ledger explains Town 1 versus Town 2 state without dashboard clutter.
- Player can focus either settlement without losing context.

## QA Gate

- Early launch is blocked by deterministic criteria.
- Town 1 and Town 2 have distinct IDs, inventories, buildings, events, and recap rows.
- Foreman activity in Town 1 cannot mutate Town 2.
- Three.js shows Governor Ledger and settlement focus state at 390px and 1280px.

## Security Gate

- Account ownership applies to every settlement shard.
- Cross-town routes and tools validate source/destination ownership.

## Migration And Rollback

- Existing single-town saves remain valid.
- Feature flag default is off.
- Rollback hides Governor Ledger controls and preserves dormant second-settlement data for later migration.
