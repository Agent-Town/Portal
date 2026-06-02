# Agent Town HQ15Q Symbol-First Text Replacement Plan

Date: 2026-06-02

## Scope

Robin reviewed the HQ15N screenshots and said the Expedition Map still has too much text. This is a report-only plan for turning the remaining primary text into visible gameplay objects, symbols, command affordances, and optional ledger details.

No app source, CSS, server, route, renderer, e2e, spec, package, or asset files were edited in HQ15Q.

## Inputs Inspected

- `reports/agent-town-hq15n-command-surface-live-qa-desktop-2026-06-02.png` (`1232x625`)
- `reports/agent-town-hq15n-command-surface-live-qa-mobile-2026-06-02.png` (`366x757`)
- `reports/agent-town-hq15n-command-surface-live-qa-contact-sheet-2026-06-02.png` (`1598x757`)
- `reports/agent-town-hq15n-command-surface-live-qa-2026-06-02.md`
- `reports/agent-town-hq15n-command-surface-live-qa-proof-2026-06-02.json`
- `public/experiences/founders-plot/founders-plot.js`
- `public/experiences/founders-plot/founders-plot.css`

## Screenshot Diagnosis

The map is technically map-first, but the first read is still text-first.

- Desktop: the top-left unit roster and command bar form the strongest text block. It repeats selected-unit state, action labels, raw cell IDs, target labels, move counts, and server-state chips before the player reads the map.
- Desktop: the right visual inspector still competes with the map. It contains visible status, summary, metrics, fog legend, objective copy, and selected-sector chrome.
- Desktop: the bottom selected-sector summary has useful symbols, but it still says the same fog, Scout eligibility, provenance, and party information in text chips.
- Mobile: the first screen is dominated by "Map units" plus unit cards and command chips. The map appears below that surface, so the strongest mobile impression is still a command transcript.
- Mobile: raw identifiers like `cell_q0_r1`, `cell_origin`, and `cell_q1_r-1` are visible as command-target text instead of being represented by map rings, target badges, or route arrows.

## Product Rule

Use this conversion rule for HQ15R/HQ15S:

- If text names a thing, make the thing visible: unit token, sector marker, fog glyph, receipt mark, party avatar, target ring.
- If text names an action, make it a command control: icon button, radial command, target ring, selected unit mode.
- If text proves authority, move it behind an optional Ledger/Receipts detail layer.
- If text repeats a map fact already visible on the map, remove it from the primary surface and preserve it only in `aria-label`, `title`, test data, or collapsed proof.

## Ranked Text-Replacement Targets

| Rank | Target | Screenshot impact | Implementation risk | Current source | Replacement plan | Acceptance gate |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Unit roster and command bar | Very high. It is the dominant desktop and mobile text block. | Medium. Visible text is likely asserted by focused e2e; update tests to prefer data attributes and accessible names. | `appendExpeditionUnitRoster` at `founders-plot.js:1158-1377`; CSS at `founders-plot.css:1287-1439`, `3083-3234`. | Convert roster to a compact icon rail: five unit tokens with sprite/glyph, role color, selected ring, and one optional selected name. Convert command bar into icon-first command tray: Move, Scout, Prepare Convoy, Found Outpost as icon buttons with `aria-label` and `title`; target cells represented by map rings and tiny target badges, not raw `cell_*` text. Remove visible "server movement active", "Move cell_origin", "Target cell_q0_r1", and selected-unit sentence chips from primary UI. | Desktop and mobile screenshots show unit rail as symbols first; no visible raw `cell_` IDs in command chips; all existing command buttons still have stable `data-testid`, endpoint payload guards, and accessible labels. |
| 2 | Mobile top stack height | Very high. On 366px mobile, map content starts too low after the roster/commands. | Medium. Requires careful CSS constraints and horizontal rail behavior. | Mobile rules at `founders-plot.css:3160-3234`. | Keep unit rail horizontal, but make selected commands a single compressed row or bottom command dock over the map. Show only active command icons and target-count glyphs. Move command detail to a tap/long-press tooltip or collapsed command ledger. | At `390px` and `366px`, the map is visible in the first viewport without scrolling past a prose block; command icons are not clipped; no horizontal overflow. |
| 3 | Fog pips and fog legend | High. Fog state is repeated in top pips, bottom selected summary, and right inspector legend. | Low. Existing `EXPEDITION_FOG_COPY` and fog data attributes can remain intact. | `EXPEDITION_FOG_COPY` at `founders-plot.js:60-90`; `appendExpeditionMapVisualHud` fog pips at `1071-1105`; `appendExpeditionFogLegend` at `965-991`; CSS at `1040-1127`, `1858-1958`. | Make primary fog UI four glyph-count counters only: discovered, known, hinted, locked. Remove visible long labels and meanings from primary HUD. Keep meanings in collapsed Fog ledger and accessible labels. In the inspector, replace the grid legend with an icon row or collapse it by default. | Primary desktop/mobile HUD shows no explanatory fog prose; hidden and locked cells still do not expose resource/route/action truth; Fog ledger remains collapsed. |
| 4 | Selected-sector summary | High. Bottom-left desktop and bottom mobile summary repeats fog state, Scout eligibility, provenance, and party names. | Medium. It mixes selected-cell, receipt, party, and Scout eligibility surfaces. | `appendExpeditionMapVisualHud` selected summary at `founders-plot.js:1107-1152`; CSS at `1129-1285`. | Convert selected summary into a symbol tray: selected-cell glyph, fog glyph, Scout-eligible icon, receipt count, party avatars/initials, and optional one-line selected title. Move "Provenance sealed", "Scout Sector eligible", and party role copy into tooltips or receipts. | Selected card is one compact band on desktop and mobile; no repeated fog/authority prose is visible; Scout eligibility is represented by a Scout command icon and target ring. |
| 5 | Semantic zoom overlay | Medium-high on desktop. It adds a long sentence across the map. Already hidden on mobile. | Low. Pure front-end copy/surface. | `expeditionSemanticZoomTier` and `appendExpeditionSemanticZoomOverlay` at `founders-plot.js:2201-2289`; CSS at `1525-1583`, mobile hide at `3191-3193`. | Replace tier label plus sentence plus selected hint with a compact zoom glyph cluster: Survey/Sector/Detail icon, current zoom tier, and count mini-strip. Move explanatory copy to `title`/`aria-label` or an optional help drawer. | Desktop screenshot has no long semantic zoom sentence over the map; zoom tier remains testable and accessible. |
| 6 | Right visual inspector and objective/status copy | Medium on desktop, low on mobile because mobile clips it. | Low-medium. Mostly presentation, but ensure proof/ledger details remain available. | `appendExpeditionInspectorChrome` at `founders-plot.js:1601-1637`; `appendExpeditionObjectiveStrip` at `1547-1597`; status card in `renderExpeditionMap` at `2429-2449`; drawer sections at `1640-1658`. | Reduce default inspector chrome to icon rail plus selected title. Collapse status, objective copy, metrics, fog legend, and authority copy behind "Ledger" or "Receipts". Keep selected-sector proof and event packet drawers collapsed. | Desktop inspector no longer reads like a prose sidebar; visible drawer text is limited to short labels; authority proof remains available when opened. |
| 7 | Event packet and selected-sector proof drawer interiors | Medium when opened, low in default screenshot. | Low if default collapsed state remains. | `appendSelectedExpeditionDetails` at `founders-plot.js:2329-2375`; `appendExpeditionEventPacketSurface` at `2021-2060`; Fog ledger at `2520-2539`. | Keep these as audit views, not primary play UI. When opened, show receipt cards with symbols first, then compact details. Do not make them action surfaces. | Drawers are collapsed by default; opening them shows receipts without adding any executable actions or hidden truth. |
| 8 | Fallback board title and hidden-silhouette copy | Low in current Three.js screenshot, but still text if fallback appears. | Low. | Board title/copy at `founders-plot.js:2455-2490`. | Hide fallback prose whenever Three.js renders; for fallback, use a small legend icon row plus accessible description. | Three.js screenshot does not show fallback prose; fallback still has accessible map description. |

## Suggested Lane Split

### HQ15R - Unit/Command Compaction

Goal: remove the largest screenshot text block without changing server authority.

Work:

- Compact `appendExpeditionUnitRoster` into a symbol-first unit rail.
- Replace visible selected-unit sentence with selected ring, sprite/glyph, and optional short name.
- Convert command bar to icon-first controls with accessible labels:
  - Move: arrow/step icon button, existing `move-unit` endpoint only.
  - Scout Sector: scout/compass icon button, existing Scout Sector endpoint only.
  - Prepare Convoy: convoy icon button, existing prepare endpoint only.
  - Found Outpost: outpost icon button, existing found-settlement endpoint only.
- Move raw target IDs and server-state strings into `title`, `aria-label`, `data-*`, or collapsed ledger.
- Preserve all current `data-testid` hooks or add stable replacements before updating e2e.

Acceptance gates:

- Existing Scout, Surveyor, Settler, and move command payload assertions still pass.
- `FP-E2E-022` still proves five units render and commands are reachable.
- Visible command chips do not include raw `cell_` IDs, "server movement active", or repeated selected-unit prose.
- Scout Sector remains the only fog reveal path.
- Scout movement remains adjacent discovered/known same-plot only.
- Surveyor/Settler commands still use existing guarded endpoints.

### HQ15S - Fog/Selected/Inspector Compaction

Goal: collapse secondary proof language and make map symbols carry the state.

Work:

- Convert fog pips to glyph-count counters with accessible labels.
- Collapse the right inspector status, objective copy, fog legend, and authority text into Ledger/Receipts details.
- Compact selected-sector summary into a symbol tray: selected cell, fog state, Scout eligibility, receipt count, party avatars.
- Keep hidden and locked truth redacted in all collapsed and visible states.
- Keep Event Packet and selected-sector proof drawers collapsed by default and non-executable.

Acceptance gates:

- Primary desktop and mobile screenshots show map symbols, unit tokens, and command icons before prose.
- Fog meanings and authority proof are available only in collapsed detail or accessible labels.
- Hidden/hinted/locked sectors do not reveal resources, routes, rewards, actions, or private truth.
- Sector action aliases remain secondary/collapsed and do not reappear as primary controls.
- No new mutation paths are added.

### HQ15T - Screenshot QA and Guardrail Proof

Goal: prove Robin's "too much text" critique was actually addressed.

Work:

- Run desktop and mobile browser screenshots after HQ15R/S.
- Create a new contact sheet and proof JSON.
- Add visual assertions for text-budget regressions:
  - No visible raw `cell_` IDs in the primary command bar.
  - No visible "server movement active", "movement pending server slice", "read-only selection", "Provenance sealed", or long semantic zoom copy in the default viewport.
  - Unit roster visible as symbols/tokens, not five prose cards.
  - Fog ledger, selected-sector proof, event packet evidence, and sector action aliases remain collapsed by default.
- Keep endpoint/payload assertions from HQ15N.

Acceptance gates:

- `node --check` on touched front-end/e2e files.
- `npm run build:founders-plot-threejs`.
- Focused `FP-E2E-022` and `FP-E2E-023`.
- Relevant Founders Plot unit/contract/http/perf tests if source/server contracts are touched; otherwise focused tests plus existing endpoint assertions.
- New proof JSON parses and records the guardrails below.
- `git diff --check`.

## Global Guardrails

These are hard constraints for HQ15R/HQ15S/HQ15T:

- No server authority expansion.
- No hidden truth leakage.
- No new mutation paths.
- Scout Sector remains the only fog reveal path.
- Scout movement remains adjacent revealed-cell movement only: discovered/known cells, same plot, no fog reveal.
- Surveyor and Settler commands use existing endpoints only:
  - `/api/founders-plot/prepare-settler-convoy`
  - `/api/founders-plot/found-settlement`
- Unit, command, fog, receipt, and target UI must be projections of server-owned read models or existing endpoint state.
- No resource gathering, route/trade/economy/reward/combat/scheduler behavior, cross-plot mutation, Atlas execution, public sharing, deploy, merge, push, external effects, Generated Universe runtime expansion, or hidden autonomy.
- No commit, push, deploy, merge, unrelated cleanup, or reverting other workers' edits without Robin's explicit approval.

## Verdict

`PLAN_READY_FOR_HQ15R_HQ15S_HQ15T`

The fastest visual win is HQ15R. The biggest overall readability gain is HQ15R plus HQ15S, followed by HQ15T screenshot QA that proves the default viewport no longer reads like a transcript.
