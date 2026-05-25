# V3.1 Specialist Foremen Release Gate

Status: required before promoting `FEATURE_FOUNDERS_V31_SPECIALISTS`.

## Product Gate

- Specialists are staffing lanes under Clover, not separate opaque agents.
- Player can pause, reassign, and review each specialist.
- Conflicts are surfaced as decisions, never silent arbitration.

## QA Gate

- Domain-scoped tool permissions are enforced.
- Pause/reassign persists across reload.
- Conflict approval flow blocks action until resolved.
- Three.js coverage includes specialist state only when enabled.

## Security Gate

- Specialists cannot exceed the main Foreman authorization boundary.
- Specialist state restores from account/agent backup without secrets.

## Migration And Rollback

- Existing towns start with no specialist assignments.
- Feature flag default is off.
- Rollback clears visible staffing UI and leaves historical events readable.
