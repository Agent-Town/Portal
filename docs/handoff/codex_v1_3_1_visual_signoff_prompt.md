# Codex Task Prompt — Implement Founders Plot V1.3.1 Visual Surface Signoff Pass

Use this prompt with the attached V1.3.1 spec and updated design-governance files.

```md
# Task: Implement Agent Town: Founders Plot V1.3.1 Visual Surface Signoff Pass

You are implementing the attached specification:

`specs/23_founders_plot_v1_3_1_visual_signoff_pass.md`

Use GPT-5.4 Extra High thinking.

## Read order before editing code

1. `AGENTS.md`
2. `Brand kit/guidelines/agent-town-design-pack/BRAND.md`
3. `Brand kit/guidelines/agent-town-design-pack/DESIGN.md`
4. `Brand kit/guidelines/agent-town-design-pack/GAME_UX.md`
5. `Brand kit/guidelines/agent-town-design-pack/REGISTRY.md`
6. `specs/23_founders_plot_v1_3_1_visual_signoff_pass.md`
7. `specs/24_founders_plot_v1_3_1_tdd_acceptance_matrix.md`

## Implementation mode

This is a focused V1.3 signoff polish pass.

Do not rewrite the shell.
Do not add gameplay systems.
Do not add new resources, contracts, doctrine, persistent/off-session Foreman, social systems, blockchain flows, or new runtime architecture.

Preserve the V1.3 scene-first architecture and V1.2 gameplay behavior.

## Required implementation goals

1. Hide/collapse Agent Comms and worker-debug panels during normal Founders Plot gameplay.
2. Add full-route tests for `/app?district=founders-plot` or the current equivalent player route.
3. Improve primary-view art/asset quality to frontier-storybook signoff quality.
4. Add named human approval metadata to primary-view assets.
5. Create/record a canonical 1280px hero screenshot from the actual app route.
6. Make Clover `ACTING` visibly target-linked to the world object being acted upon.
7. Reduce mobile label density and prevent label overlap.
8. Distinguish `available` from `recommended` lots and allow only one strong attention object by default.
9. Limit badge stacking.
10. Split or quarantine OpenRouter/proxy work if present.
11. Update the design docs and registry docs with the V1.3.1 rules.

## Plan first

Before coding, produce a concise plan:

- files to change;
- components/modules to modify;
- asset plan;
- test plan;
- screenshot plan;
- scope risks;
- whether OpenRouter/proxy files are touched and how they are quarantined.

## Required final report

When done, report:

1. summary of changes;
2. files changed;
3. assets added/changed and approval metadata;
4. screenshots captured;
5. tests added/updated;
6. commands run and results;
7. confirmation that no gameplay systems were added;
8. confirmation that normal Founders Plot gameplay has no visible debug/runtime/provider panels;
9. known limitations;
10. any required human art-direction signoff still pending.
```
