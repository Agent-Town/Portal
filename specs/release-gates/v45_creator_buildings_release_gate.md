# V4.5 Creator Buildings Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V45_CREATOR_BUILDINGS`.

## Product Gate

- Creator buildings are curated, approved town additions, not an open marketplace.
- Install, disable, and remove controls are explicit.
- Credits are visible without introducing token farming or revenue claims.

## QA Gate

- Manifest, tool schema, moderation, asset provenance, and rollback tests pass.
- Creator tools cannot mutate core town truth outside their typed state.
- Three.js shows creator objects only when installed and enabled.
- 390px and 1280px screenshots show no UI clutter.

## Security Gate

- No network-capable or unreviewed creator code runs in normal gameplay.
- Creator actions receive only public-safe town summaries.
- External imports require a separate moderation/security gate.

## Migration And Rollback

- Existing towns start with no creator extensions.
- Feature flag default is off.
- Rollback disables creator tools and hides installed creator objects while preserving core town state.
