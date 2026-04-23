# Agent Town V1.4.3 — App-Wide Visual Signoff Sheet

**Sprint:** App-Wide GPT Image 2 Asset Refresh  
**Reviewer / art owner:** Robin  
**Date:** 2026-04-23  
**Current release status:** Release-candidate ready — automated coverage is green, owner-approved baseline decisions are recorded, and no blocking visual/code caveats remain in the branch

---

## Signoff scope

This sheet covers non-Founders-Plot gameplay app assets:

- Start Gate
- Town shell
- Town Hall onboarding
- Brain connect
- House / claim / share
- Pony Express / Inbox
- Saloon
- Sigil
- Atlas
- Leaderboard
- generic empty/loading/error visuals
- platform hero-cast usage

It does not reopen accepted Founders Plot gameplay art unless a later Founders Plot patch explicitly requires it.

---

## Owner-approved decisions

- The `WARNING! CONTAINS AND PRODUCES AI SLOP.` line is owner-approved humorous brand copy.
- Hero cast is approved for platform/brand/onboarding/marketing surfaces.
- Clover remains the gameplay partner in Founders Plot.
- GPT Image 2 assets must be prompt-versioned and manifest-backed.
- Atlas remains modal-first, but the V1.4.3 Atlas illustration must still be visible in the live modal embed route.
- The full `/app` Founders Plot route must match the embedded mobile calmness budget after desktop-to-mobile resize, not only on a fresh 390px open.

---

## Screenshot checklist

| Surface | Screenshot path | Status | Notes |
|---|---|---|---|
| Start Gate desktop | `e2e/194_agent_town_v1_4_3_start_gate_visual.spec.js-snapshots/agent-town-v1-4-3-start-gate-desktop-1280-chromium-darwin.png` | current baseline | 1280px |
| Start Gate mobile | `e2e/194_agent_town_v1_4_3_start_gate_visual.spec.js-snapshots/agent-town-v1-4-3-start-gate-mobile-390-chromium-darwin.png` | current baseline | 390px |
| Town shell desktop | `e2e/195_agent_town_v1_4_3_town_shell_visual.spec.js-snapshots/agent-town-v1-4-3-town-shell-desktop-1280-chromium-darwin.png` | current baseline | 1280px |
| Town shell mobile | `e2e/198_agent_town_v1_4_3_mobile_platform_visual.spec.js-snapshots/agent-town-v1-4-3-town-shell-mobile-390-chromium-darwin.png` | current baseline | 390px |
| Town Hall onboarding | `e2e/196_agent_town_v1_4_3_townhall_brain_visual.spec.js-snapshots/agent-town-v1-4-3-townhall-modal-1280-chromium-darwin.png` | current baseline | 1280px |
| Brain connect | `e2e/196_agent_town_v1_4_3_townhall_brain_visual.spec.js-snapshots/agent-town-v1-4-3-brain-modal-1280-chromium-darwin.png` | current baseline | 1280px |
| House | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-house-route-1280-chromium-darwin.png` | current baseline | 1280px |
| Pony Express | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-inbox-route-1280-chromium-darwin.png` | current baseline | 1280px |
| Saloon | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-saloon-modal-1280-chromium-darwin.png` | current baseline | 1280px |
| Sigil | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-sigil-modal-1280-chromium-darwin.png` | current baseline | 1280px |
| Atlas | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-atlas-route-1280-chromium-darwin.png` | current baseline | 1280px |
| Leaderboard | `e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js-snapshots/agent-town-v1-4-3-leaderboard-route-1280-chromium-darwin.png` | current baseline | 1280px |

---

## Truth split

### What automated tests prove

- `tests/v1_4_3_*` verifies manifest schema, prompt coverage, budget, inventory coverage, and no orphan production assets.
- `e2e/194` through `e2e/199` verify the V1.4.3 visual routes, screenshot baselines, asset usage, and mobile calmness across the refreshed platform surfaces.
- `e2e/200` verifies normal routes stay free of debug leakage and release-candidate copy regressions such as raw `agent.panel.*` keys or `NO_SOLANA_WALLET`.
- `e2e/201` and the retained Founders Plot suite verify the accepted Clover-first gameplay surface was not reopened.
- `e2e/162` verifies the stricter mobile calmness law also holds on the full `/app` route, not only the embedded Founders Plot frame.

### What product/design review approved

- The V1.4.3 GPT Image 2 asset pack is the current platform visual baseline.
- The owner-approved `WARNING! CONTAINS AND PRODUCES AI SLOP.` copy remains intentionally unchanged.
- The calmer mobile behavior remains part of the accepted release line.
- Founders Plot stays on its accepted visual baseline; this release line does not reopen gameplay art direction.

### Remaining caveats

- No blocking visual or route-level code caveats are currently open on the release branch.
- Final product/design release signoff is still a human process outside automated testing; this sheet records the current branch truth, not a substitute for that human approval step.

---

## Final approval language

Use one of:

```text
Approved as the Agent Town V1.4.3 app-wide platform art baseline.
```

```text
Release-candidate ready: route-integrated V1.4.3 pack is accepted as the current baseline, automated signoff is green, and the remaining release decision is a human product/design call.
```

```text
Not approved: [blocking reasons].
```
