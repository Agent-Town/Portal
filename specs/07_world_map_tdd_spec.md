# World Map Spec (Phaser + Colyseus + Redis)

Status: Draft v1  
Date: 2026-02-06  
Owners: Product + AI Dev Team

## 1) Goal

Build a public, web-first world map that visualizes platform houses and inhabitants, then evolves into real-time multiplayer with instancing and clip recording/export.

This spec is implementation-oriented and test-driven so AI developers can execute in small, verifiable milestones.

## 2) Scope

### In scope
- Public `/world` experience visible to visitors.
- House + inhabitant population sourced from platform data.
- Real-time movement and interaction for signed-in users.
- Instance assignment when capacity is exceeded.
- Special houses that host experiences.
- Client-side recording button with clip export and share link flow.

### Out of scope (for this track)
- Native mobile app.
- Token farming, points, or engagement loops.
- External identity providers.
- Non-deterministic tests or manual-only QA gates.

## 3) Inputs and dependency matrix

### Required inputs
- Existing platform houses and inhabitants data.
- Session-token identity (existing `et_session` model).
- Team Code model for co-op continuity.
- Brand Kit v1 (colors, type, illustration rules, motion, audio direction).

### What can start before Brand Kit v1

| Area | Can start without brand kit? | Temporary fallback |
|---|---|---|
| Data model + projection pipeline | Yes | Neutral placeholder schema and seeded fixtures |
| API contracts (HTTP + realtime messages) | Yes | Versioned JSON contracts with test fixtures |
| World page layout + camera controls | Yes | Wireframe HUD and grayscale placeholders |
| Multiplayer sync and authority model | Yes | Debug capsules/circles for avatars |
| Instance allocation logic | Yes | Text labels for house categories |
| Recording/export pipeline | Yes | Watermark text placeholder + default audio mute |
| Final art style, iconography, typography | No | Use temporary tokens only |
| Final SFX/music style and loudness profile | No | Silent/default click placeholders |

Rule: no milestone blocks on brand kit unless it directly affects visual/audio finalization.

## 4) Architecture

### Components
1. `public/world.html` + `public/world.js`
- Phaser 3 scene with map camera, culling, render layers, HUD.

2. `server/index.js` (HTTP)
- World snapshot endpoints for read-only visitors.
- Clip metadata and retrieval endpoints.

3. `world-realtime` (Colyseus server)
- Authoritative room state, movement, proximity interactions.
- Instance-level room lifecycle.

4. `Redis`
- Presence registry, room directory, pub/sub fanout, lightweight projections cache.

5. Projection job/service
- Converts canonical platform house/inhabitant data into `world_projection_v1`.

### Authority model
- Server authoritative for movement, interaction triggers, and instance assignment.
- Client sends intents only (never final positions).

### Determinism model
- Fixed simulation tick for tests (e.g., 20 Hz).
- Seeded fixture world for CI (`world_seed = "test-world-v1"`).
- Stable object ordering (`sort by houseId` then `inhabitantId`).

## 5) Data contracts (v1 draft)

### `HouseProjection`
```json
{
  "houseId": "H_123",
  "instanceTags": ["craft", "music"],
  "type": "player|experience",
  "name": "Crawfish Saloon",
  "ownerSessionId": "sess_abc",
  "coord": { "x": 1200, "y": 640 },
  "spriteKey": "house.western.tier1.v1",
  "updatedAt": "2026-02-06T10:00:00.000Z"
}
```

### `InhabitantProjection`
```json
{
  "inhabitantId": "I_456",
  "houseId": "H_123",
  "label": "Sheriff Bot",
  "role": "agent|human|npc",
  "spriteKey": "inhabitant.sheriff.v1",
  "updatedAt": "2026-02-06T10:00:00.000Z"
}
```

### `InstancePolicy`
```json
{
  "maxPlayers": 120,
  "maxHouses": 400,
  "minExperienceHouses": 20,
  "strategy": "player_houses_plus_curated_fill_v1"
}
```

### `ClipRecord`
```json
{
  "clipId": "clp_abc123",
  "ownerSessionId": "sess_abc",
  "instanceId": "inst_west_03",
  "durationSec": 30,
  "status": "uploaded|processing|ready|failed",
  "storage": {
    "sourceUrl": "/media/source/clp_abc123.webm",
    "mp4Url": "/media/final/clp_abc123.mp4"
  },
  "createdAt": "2026-02-06T10:00:00.000Z"
}
```

## 6) API and realtime contract changes

All new endpoints must be documented in `specs/02_api_contract.md` as each milestone lands.

### HTTP (draft)
- `GET /api/world/snapshot?instance=public`
- `GET /api/world/houses/:houseId`
- `GET /api/world/inhabitants/:inhabitantId`
- `POST /api/world/instance/assign`
- `POST /api/clips`
- `POST /api/clips/:clipId/upload-complete`
- `GET /api/clips/:clipId`

### Colyseus room (draft)
- Room: `world_instance_v1`
- Client -> Server intents:
  - `move_intent { dirX, dirY, seq }`
  - `interact_intent { targetType, targetId }`
- Server -> Client events:
  - `state_patch`
  - `interaction_result`
  - `instance_transfer`

## 7) Test strategy (TDD-first)

### Required test layers
1. Contract tests (HTTP schema + error codes).
2. Deterministic projection tests (stable fixture output).
3. Multiplayer integration tests (2+ browser contexts).
4. End-to-end Playwright tests for visitor and signed-in flows.
5. Performance guard tests (entity caps, frame/tick budget proxies).

### Execution protocol for AI developers
1. Write failing tests first for a single milestone.
2. Implement minimum code to pass.
3. Refactor without changing behavior.
4. Update docs (`specs/02_api_contract.md`, this file if needed).
5. Run full suite (`npm test`) before merge.

### Deterministic fixture requirements
- Add stable fixtures under `data/fixtures/world/`.
- `POST /__test__/reset` must reset world projection and instance state.
- No dependency on wall clock for assertions; use server-injected test time when needed.

## 8) Milestones

Milestones continue after existing `M0..M7`.

### M8 — World foundation (read-only data + page shell)

Goal: Visitors can open `/world` and see deterministic houses from fixture data.

Brand kit dependency: No (placeholder visual tokens allowed).

Deliverables
- `GET /api/world/snapshot?instance=public`.
- `public/world.html` with canvas + minimal HUD shell.
- Deterministic fixture loader and test reset integration.

Tests (must exist and pass)
- `e2e/13_world_readonly.spec.js`
  - `/world` loads for logged-out visitor.
  - Exactly N fixture houses render.
  - House ordering and ids are deterministic across reloads.
- `server` contract test:
  - Invalid instance returns `400 INVALID_INSTANCE`.

Done gate
- Existing tests + `e2e/13_world_readonly.spec.js` pass.

### M9 — Camera, culling, and house detail cards

Goal: Map remains usable/perf-safe with large house counts.

Brand kit dependency: No.

Deliverables
- Pan/zoom controls with bounded extents.
- Spatial culling for off-screen entities.
- Click/tap house to open detail card.

Tests
- `e2e/14_world_camera_cards.spec.js`
  - Pan and zoom affect viewport predictably.
  - Clicking house marker opens correct details.
  - Off-screen houses are not in DOM overlay list.

Done gate
- 1k-house fixture still passes interaction tests with no crashes.

### M10 — Inhabitant population and live projection refresh

Goal: Houses display inhabitant counts and inhabitant summaries.

Brand kit dependency: No.

Deliverables
- Projection pipeline from platform records -> `world_projection_v1`.
- Snapshot includes inhabitants with stable sorting.
- Lightweight refresh channel (poll or ws) for read-only updates.

Tests
- `e2e/15_world_inhabitants.spec.js`
  - House card shows inhabitant count and labels.
  - Projection updates appear without hard refresh.
- Contract tests:
  - Missing house id returns `404 NOT_FOUND`.

Done gate
- Fixture mutation test updates exactly expected houses.

### M11 — Realtime multiplayer core (single instance)

Goal: Signed-in users can join a world instance and see each other move.

Brand kit dependency: No.

Deliverables
- Colyseus `world_instance_v1` room with authoritative movement.
- Session-token auth handshake for room join.
- Presence + state patch broadcast.

Tests
- `e2e/16_world_realtime.spec.js`
  - Two users join same instance and see each other.
  - Movement appears to the other client within bounded latency.
  - Invalid move intents are ignored and do not desync state.

Done gate
- Multi-context Playwright tests stable in CI.

### M12 — Instance assignment + house-set composition

Goal: Users are assigned to capacity-safe instances that include player and curated experience houses.

Brand kit dependency: No.

Deliverables
- `POST /api/world/instance/assign`.
- Redis-backed instance directory and capacity accounting.
- Composition policy:
  - Include houses of players present in the instance.
  - Fill remaining slots with curated `type=experience` houses by policy.

Tests
- `e2e/17_world_instancing.spec.js`
  - Capacity overflow creates/assigns a second instance.
  - Player-owned houses appear in assigned instance.
  - Curated house floor (`minExperienceHouses`) is enforced.
- Contract tests:
  - Policy mismatch errors are deterministic.

Done gate
- Instance assignment is deterministic for same seed + same inputs.

### M13 — Special houses and interaction protocol

Goal: Players can interact with special houses and receive deterministic outcomes/events.

Brand kit dependency: Partial (visual polish later).

Deliverables
- Interaction intents/response events in room protocol.
- Special house behaviors behind feature flags.
- Minimal interaction UI states (idle, active, cooldown).

Tests
- `e2e/18_world_special_houses.spec.js`
  - Interactions trigger expected server event.
  - Cooldown prevents spam within configured interval.
  - Unauthorized interactions return typed error state.

Done gate
- No client-authoritative interaction results.

### M14 — Record button + local export

Goal: Player can click Record, capture a clip, stop, and export locally.

Brand kit dependency: No (final visual treatment later).

Deliverables
- Record button and timer UI.
- Canvas + game audio capture via `MediaRecorder`.
- Export file generation and local download path.

Tests
- `e2e/19_clip_local_export.spec.js`
  - Record button starts/stops capture.
  - Output file exists and is non-empty.
  - Duration constrained to configured min/max.

Done gate
- Export works on Chromium in CI; unsupported browsers show explicit fallback message.

### M15 — Clip upload, transcode, and share metadata

Goal: Exported clips can be uploaded, processed, and shared with stable URLs.

Brand kit dependency: No.

Deliverables
- Clip upload completion endpoint.
- Async transcode worker and ready/failed status.
- Share metadata endpoint for social previews.

Tests
- `e2e/20_clip_share.spec.js`
  - Upload transitions `uploaded -> processing -> ready`.
  - Share link returns metadata and playable asset URL.
  - Oversized/invalid uploads fail with typed errors.

Done gate
- All clip status transitions are idempotent and retry-safe.

### M16 — Brand integration + launch hardening

Goal: Apply Brand Kit v1 and hit launch quality gates.

Brand kit dependency: Yes (this is the main brand-dependent milestone).

Deliverables
- Replace placeholder tokens with Brand Kit v1 tokens and asset manifest keys.
- Final typography/color/motion/audio rules applied.
- Observability dashboards + error budget alarms.
- Load test report for expected concurrency.

Tests
- `e2e/21_world_brand_regression.spec.js`
  - Tokenized styles are loaded from brand variables.
  - Core pages meet contrast and minimum text-size checks.
- `e2e/22_world_smoke_launch.spec.js`
  - Visitor world, join world, interact, record, and share all pass in one flow.

Done gate
- `npm test` passes fully.
- API contract updated in `specs/02_api_contract.md`.
- Minimal UI constraints preserved.

## 9) Quality gates for every milestone

- No flaky tests introduced (`maxRetries` policy respected).
- New APIs return typed errors, not generic 500s.
- Backward compatibility: existing landing/co-op tests remain green.
- Security checks for new endpoints (input validation, rate limiting plan, auth boundary).
- Documentation updated alongside code.

## 10) Open decisions (must be resolved before M11/M12)

1. Single combined server vs separate deploy units for Express and Colyseus.
2. Target region strategy for instance locality.
3. Clip retention period and storage budget.
4. Moderation policy for shared clips and house labels.
5. Exact launch concurrency target for instance sizing.

## 11) Immediate next sprint recommendation

Start now with M8 and M9 in parallel branches:

1. Branch A (`M8`): projection contract + snapshot endpoint + deterministic fixtures + tests.
2. Branch B (`M9`): world scene shell + camera + house cards using fixture endpoint.

Then merge behind a feature flag `WORLD_MAP_V1` and continue to M10.
