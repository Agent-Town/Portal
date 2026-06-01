# Agent Town HQ13 Visual Architecture Kickoff

Date: 2026-06-01
Lane: parent coordination kickoff after Robin reopened the next AgentTown push.
Verdict: STARTED.

## Direction

Robin wants HQ13 to lean hard into GPT Image 2.0-quality visual assets and design, especially for the Expedition Map north-star look, while keeping the underlying system ready for future progressions, generated universe packs, alternate inhabitants, and eventually in-game agent/editor extension.

This is architectural pressure for the next slices, not permission to add broad gameplay authority.

## Parent Actions

- Reopened HQ13 work after the overnight HQ12R handoff.
- Confirmed no active OpenClaw subagents were running before refill.
- Started one GPT Image 2.0 concept-generation task for Expedition Map north-star visual direction.
- Spawned three non-`/fast` Codex child lanes with disjoint scopes:
  - HQ13A Visual Universe Pack Architecture: Lorentz, `019e80c1-2714-7062-8a30-2092a35dfacd`.
  - HQ13B North-Star Expedition Map Visual Shell: Jason, `019e80c1-2759-7350-81fe-166f1cf74da6`.
  - HQ13C Location Scene Visit Model: Ampere, `019e80c1-279b-7582-ab96-a0eb6908adb2`.

## Initial Architecture Observations

The existing codebase already has useful patterns to standardize:

- Character assets use generated/source/runtime image files, JSON metadata, prompt sidecars, named character biography, frame layout, role facts, action mapping, and authority-boundary text.
- Object/card assets use generated/runtime/WebP variants, JSON metadata, prompt sidecars, source provenance, constraints, and presentation-only flags.
- Generated Universe overlay packs already sanitize presentation values and provenance before surfacing them.
- Founders Plot scene projection keeps visual actors tied to real server/read-model facts.
- HQ12 Expedition Map renderer already consumes server-owned map cells, has pan/zoom/select, and keeps Scout Sector as the only map mutation path.

## Near-Term Shape

HQ13 should treat visual work as content packs:

- A default Expedition Map visual pack should define terrain, fog, route, marker, HUD, event-card, and party-presence assets.
- A location scene pack should define authored sector scenes that are visited from the overview map, not simulated as one continuous giant 3D world.
- Every generated image should keep prompt/provenance metadata and a runtime slot, with selection/approval separated from gameplay authority.
- Future in-game editor work should preview generated pack changes and require explicit approval before committing assets or changing server-readable manifests.

## Guardrails

- No server authority changes from this kickoff.
- No new mutation path.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy or background scheduler behavior.
- No route/trade/economy/resource-harvesting/combat systems.
- No Wild West/cowboy/saloon/gold-rush drift.
