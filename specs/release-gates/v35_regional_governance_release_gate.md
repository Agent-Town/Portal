# V3.5 Regional Governance Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V35_REGIONAL_GOVERNANCE`.

## Product Gate

- Regional routes feel like bounded supply decisions, not a free shared inventory.
- Regional contracts explain involved towns and route progress.
- Camera focus and map state are readable in the Three.js scene.

## QA Gate

- Wrong-town transfer attempts fail.
- Cross-town resource conservation holds for every route transfer.
- Shortage/retry behavior is deterministic.
- Three.js route links and regional ledger screenshots pass at 390px and 1280px.

## Security Gate

- Every route validates owner, source town, destination town, and resource limits.
- Public regional summaries redact private town state.

## Migration And Rollback

- Existing towns start with no active routes.
- Feature flag default is off.
- Rollback hides regional tools/routes and preserves town inventories.
