# Agent Town Founders Plot HQ1-HQ3 Reachability Fix

Date: 2026-05-29
Repo: `/Users/robin/Projects/Portal`
Branch: `neo/founders-plot-rigger-live-inhabitants-cleanup-2026-05-28`

## Summary

Fresh Founders Plot progression can now reach HQ Level 3 through normal public engine/API actions with no hidden resource grants.

Changes made:

- HQ Level 1 now unlocks Lumber Camp and Farm Plot, so food can be produced before the HQ2 upgrade asks for food.
- HQ Level 2 now unlocks Quarry, so stone can be produced before the HQ3 upgrade asks for stone.
- HQ Level 3 keeps the foreman `queueProduction` permission unlock and no longer gates the first stone producer.
- Early production outputs and HQ2 -> HQ3 cost were tuned down so the path is reachable without dozens of cycles.
- Quest guidance now has explicit stockpile steps before Farm Plot, HQ2, Quarry, and HQ3, including current/required/missing resources and XP.
- The Founders Plot UI now shows exact build/upgrade requirements, current holdings, missing amounts, and HQ lock status directly on build cards and upgrade controls.

## Economy Path Proven

The deterministic test path is:

1. Build Lumber Camp at HQ1.
2. Produce and collect wood until Farm Plot is affordable.
3. Build Farm Plot at HQ1.
4. Produce and collect wood/food until HQ2 is affordable.
5. Upgrade HQ to Level 2.
6. Produce and collect wood/food until Quarry is affordable.
7. Build Quarry at HQ2.
8. Produce and collect stone/wood until HQ3 is affordable.
9. Upgrade HQ to Level 3.

No reward claims are required in the proof path.

## Validation

Passed:

```bash
node --check server/founders_plot/engine.js
node --check public/experiences/founders-plot/founders-plot.js
node --test tests-founders-plot/fp-unit.test.js
npm run test:founders-plot
PW_PORT=4321 npx playwright test e2e/200_founders_plot.spec.js
PW_PORT=4322 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js
```

Results:

- `fp-unit.test.js`: 16/16 passed, including `FP-IT-004 fresh plot can reach HQ Level 3 through normal progression`.
- `npm run test:founders-plot`: 39/39 passed.
- `e2e/200_founders_plot.spec.js`: 9/9 passed.
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`: 1/1 passed.

## Notes

Three.js scene source was not changed, so the bundle was not rebuilt.

Existing unrelated untracked files in the working tree were left untouched.
