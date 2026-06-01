# Agent Town HQ13V Map UI Theme Course Correction

Date: 2026-06-01
Lane: HQ13V report/proof only
Verdict: COURSE_CORRECTION_REQUIRED_PROMPT_ANCHOR_ADDED

## Trigger

Robin correctly flagged that the latest Expedition Map visual-pack directions
were at risk of breaking AgentTown's theme. The issue is not that the assets
literally became cowboy art. The issue is that the prompts overcorrected into a
generic cozy civilization-builder map vocabulary and did not strongly carry the
AgentTown founder/frontier-tech identity.

## Reconciled Constraint

Use both halves of the constraint:

- Do not generate literal Western genre art: no cowboys, saloons, gold-rush
  prospecting, wanted posters, guns, conquest borders, or American Western
  cosplay.
- Do generate AgentTown frontier-tech civic art: warm hand-built settlement
  materials, scout reports, ledgers, receipts, plan wagons, beacons, brass,
  canvas, parchment, worn teal, cream paper, subtle agent-tech glow, and
  human-plus-agent civic cooperation.

The frontier is the founding threshold between old human settlement craft and
new agent collaboration. On the Expedition Map, `frontier` also means the
server-owned unrevealed map edge. It should never become a conquest border,
trade route, military line, or genre-Western prop kit.

## Prompt Capsule

Prepend this to future AgentTown Expedition Map UI and visual-pack generation
prompts:

```text
AgentTown style anchor: Founders Plot is a hand-built frontier-tech civic
settlement at the threshold between old human systems and new human-plus-agent
collaboration. Visual language should feel warm, practical, neighborly,
tinkered-with, and civic: sun-bleached timber, brass, canvas, parchment,
worn teal, cream paper, scout reports, ledgers, receipts, plan wagons,
beacons, small signal/agent-tech glows, and Progression Atlas provenance.
This is frontier-founder mythology without cowboy genre cosplay.
```

## Updated Artifacts

- `docs/specs/agent-town-frontier-agentfolk-style-playbook.md`
  - Added a map/UI reconciliation note.
  - Reworded the old quick sprite prompt from literal "wild west frontier town"
    to "AgentTown frontier-tech settlement".
- `reports/agent-town-hq13e-candidate-02-asset-extraction-plan-2026-06-01.md`
  - Added the AgentTown Map UI Style Anchor.
  - Required the anchor to be prepended to every GPT Image 2 prompt brief.
  - Tightened the hinted fog, frontier boundary, and selected-sector frame
    prompt examples toward AgentTown frontier-tech civic language.
- `reports/agent-town-hq13l-generated-asset-review-rubric-2026-06-01.md`
  - Added an AgentTown identity-fit acceptance gate.
  - Updated the review procedure to compare assets against the style anchor,
    not only against generic candidate-02 polish.

## Impact On Current HQ13 Assets

The current HQ13P/Q/R/S/T/U review-only assets are not automatically thrown
away. Fog, marker, survey, boundary, and HUD assets can remain useful review
candidates, but future generation and any promotion discussion must now pass
the stronger AgentTown identity gate.

Practical next course correction:

- Keep current assets as reports/media review evidence only.
- Do not promote a runtime pack yet.
- If regenerating or adding assets, use the prompt capsule above.
- Review the current contact sheets against the new identity gate before any
  manifest/promotion lane.

## Guardrails

- Report/spec prompt correction only.
- No runtime asset promotion.
- No runtime pack directory or loader.
- No app/source/server/store/routes/tools/engine edits.
- No Atlas execution.
- No public sharing.
- No real Generated Universe rendering.
- No hidden autonomy.
- No route, trade, economy, resource, reward, combat, scheduler, cross-plot, or
  external effect.
- Scout Sector remains the only current Expedition Map mutation path.

## Verification

Planned/ran for this report/proof lane:

- `jq empty reports/agent-town-hq13v-map-ui-theme-course-correction-proof-2026-06-01.json`
- `git diff --check -- docs/specs/agent-town-frontier-agentfolk-style-playbook.md reports/agent-town-hq13e-candidate-02-asset-extraction-plan-2026-06-01.md reports/agent-town-hq13l-generated-asset-review-rubric-2026-06-01.md reports/agent-town-hq13v-map-ui-theme-course-correction-2026-06-01.md reports/agent-town-hq13v-map-ui-theme-course-correction-proof-2026-06-01.json`

No build or Playwright run was needed because this lane changes only prompt and
review documentation.
