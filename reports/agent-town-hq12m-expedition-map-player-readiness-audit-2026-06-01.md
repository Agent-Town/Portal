# Agent Town HQ12M Expedition Map Player-Readiness Audit

Date: 2026-06-01
Lane: parent backfill after the bounded HQ12M player-readiness audit worker timed out without a usable handoff.
Verdict: PASS_WITH_NOTES.

## Scope

Audited the current HQ12 Expedition Map stack after HQ12A-L:

- HQ12A server-owned Expedition Map / fog-of-war read model.
- HQ12B Founders Plot Expedition Map UI.
- HQ12C Scout Sector backend and UI.
- HQ12D Three.js zoom/pan renderer.
- HQ12E/F Expedition Event Packets backend and UI.
- HQ12G/L Expedition Party read-model flavor and visual polish.
- HQ12H/J/K mobile, legend, selected-sector, and packet presentation polish.
- Post-HQ12L regression QA.

This audit made no source edits. It only adds this report and proof JSON.

## Player-Readiness Verdict

The Expedition Map now reads as a coherent private unknown-world map path, not just a pile of panels. The core loop is visible:

1. Read a server-owned fog map.
2. Select a sector.
3. Understand fog state and hidden-truth limits.
4. Use Scout Sector as the one explicit map mutation.
5. See a receipt-bound Event Packet and named Expedition Party flavor after reveal.
6. Pan/zoom the Three.js map with semantic context labels.

That is enough to feel like the first playable map slice. It is not yet a full outside-world game. The map currently supports reveal/proof/receipt play, not travel, routes, harvesting, trade, combat, autonomous party behavior, or public/generated-universe rendering.

## Playable Now

- Private Expedition Map read model with `discovered`, `known`, `hinted`, and `locked_unknown` cells.
- Founders Plot UI for fog cells, selected-sector cards, map legend, sector status, and source/receipt rows.
- Three.js map surface with bounded zoom/pan, selectable sectors, hidden-resource suppression, and mobile touch proof.
- Scout Sector action for eligible `hinted` sectors only.
- Event Packet presentation after Scout Sector, with receipt flavor and zero packet actions.
- Expedition Party presentation sourced from server-owned `expeditionMap.expeditionParty` and `eventPacket.partySnapshot`, with Mira Trailmark, Rook Signalpost, and Vale-Desk 7 as read-only roster flavor.

## Flavor / Read-Model Only

- Expedition Event Packets are evidence/receipt flavor, not executable missions.
- Expedition Party is named presentation only, not assignable actors or autonomous operators.
- Risk/resource/terrain hints are display/read-model metadata, not harvesting, payouts, losses, routes, travel, or combat.
- Progression Atlas remains advisory/non-executable.
- Generated Universe remains local/presentation-only; no public sharing or real rendering path was added here.

## Guardrails Confirmed

- Scout Sector remains the only Expedition Map UI mutation path.
- Event Packet and Expedition Party blocks remain read-only and buttonless.
- `executableActions` remain empty on packet/party proofs.
- No server/store/engine/routes/tools/spec changes were made by this audit.
- No party management, assignment, movement, resources, route/trade/economy hooks, combat, scheduler/background behavior, public sharing, Generated Universe rendering, Atlas execution, cross-plot mutation, hidden autonomy, external effects, or Wild West/cowboy/saloon/gold-rush drift was observed in the reviewed HQ12 surfaces.

## Verification

Parent checks run during this audit:

- `node --check public/experiences/founders-plot/founders-plot.js` passed.
- `node --check e2e/200_founders_plot.spec.js` passed.
- `node --check e2e/201_founders_plot_hq12d_expedition_map_threejs.spec.js` passed.
- Existing post-HQ12L QA report/proof were read and showed PASS.
- Existing HQ12J/HQ12K/HQ12L proofs were inspected through their guardrail summaries.

Recent regression evidence from post-HQ12L QA:

- `FP-E2E-022` passed after serial rerun.
- `FP-E2E-023` passed.
- Founders Plot unit/contract/HTTP/scene-state tests passed 92/92.

## Top Next Bounded Slices

1. **Scout Sector live preflight proof.** Reduce the main residual risk that parts of HQ12 UI proofing still depend on mocked server state. Produce a report/proof that exercises the real backend/UI Scout Sector contract after the later Event Packet and Party polish.
2. **Expedition objective strip.** Add a small read-only "next expedition objective" strip that tells the player why a sector matters and what Scout Sector will do, without adding new actions or authority.
3. **Sector art and readability pass.** Add terrain/fog art treatment, compact sector cards, and better selected-sector hierarchy so the map feels more like the admired generated-image-quality target while preserving hidden-truth suppression.

## Residual Risks

- The repo remains heavily dirty with many AgentTown reports/assets/source changes from prior lanes.
- This audit did not run a full fresh HQ1-to-HQ12 progression playthrough.
- Some current proof paths still use mocked route fixtures; live Scout Sector preflight should be the next verification lane.
- The map is playable as a reveal/receipt surface, not yet as a broader exploration/travel simulation.
