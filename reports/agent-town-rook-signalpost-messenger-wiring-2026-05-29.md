# Agent Town Rook Signalpost Messenger Wiring - 2026-05-29

## Summary

Wired the Founders Plot messenger visual actor to Rook Signalpost instead of the generic `messenger-agentfolk-v1` sprite. The messenger remains a visual-only projection and keeps the existing non-mutating quest/approval/reward cue behavior: `attention_marker`, role route mode `notify`, action animation `attention_wave`, and runtime sprite action `ready` for `APPROVAL`, `REWARD`, and `QUEST`.

The Rook files were copied from the existing candidate worktree `/Users/robin/Projects/Portal-messenger-sprite` on commit `60ed6c8` (`Add Rook Signalpost messenger sprite candidate`). SHA256 checksums match between the candidate worktree and this worktree.

## Changed Files

- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.source.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json`
- `public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.prompt.md`
- `public/experiences/founders-plot/scene_state.js`
- `tests-founders-plot/fp-scene-state.test.js`
- `e2e/214_founders_plot_threejs_playable_slice.spec.js`
- `reports/agent-town-rook-signalpost-messenger-wiring-2026-05-29.md`

## Runtime Wiring

- Builder remains `rigger-slate-builder-v2`.
- Worker remains `kettle-37-worker-v1`.
- Hauler remains `oona-tallpack-hauler-v1`.
- Messenger is now `rook-signalpost-messenger-v1`.
- Clover remains on the current `v1_4_4` no-hole mapping.

`scene_state.js` keeps the messenger action mapping as:

```js
APPROVAL: 'ready'
REWARD: 'ready'
QUEST: 'ready'
```

That preserves the current runtime behavior while swapping only the messenger sprite sheet id/path/metadata path.

## Bundle Decision

`public/experiences/founders-plot/three_scene_bundle.js` was not rebuilt or modified. The build script bundles only `public/experiences/founders-plot/three_scene_entry.js`, and this change did not touch that entry source. The page loads `scene_state.js` separately before `three_scene_bundle.js`, so changing the scene-state sprite mapping does not require regenerating the bundle. The Playwright Three.js slice passed against the live page with Rook.

## Verification

- `node --check public/experiences/founders-plot/scene_state.js` - passed.
- `node --check tests-founders-plot/fp-scene-state.test.js` - passed.
- `node -e "JSON.parse(require('fs').readFileSync('public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json','utf8')); console.log('rook metadata OK')"` - passed, printed `rook metadata OK`.
- `node --test tests-founders-plot/fp-scene-state.test.js` - passed, 3/3 tests.
- `npm run test:founders-plot` - passed, 39/39 tests.
- `PW_PORT=4214 npx playwright test e2e/214_founders_plot_threejs_playable_slice.spec.js` - passed, 1/1 test.
- `PW_PORT=4215 npx playwright test e2e/200_founders_plot.spec.js` - passed, 9/9 tests.
- `shasum -a 256 public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.source.png public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.json public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.prompt.md` - run in both `/Users/robin/Projects/Portal` and `/Users/robin/Projects/Portal-messenger-sprite`; Rook file hashes match:
  - `rook-signalpost-messenger-v1.source.png`: `4a71a0d478730723a47b697b00849898eea18ed5140ddbbe0709519305592228`
  - `rook-signalpost-messenger-v1.png`: `08090257cb29393dd3dd18376e4d585c27d91194752f97b1e23bec2e878dfbfa`
  - `rook-signalpost-messenger-v1.json`: `ff746ec40d25c11c7728ccbfcfc7ce9b67ace24765f1adc5aa19d4a463f12856`
  - `rook-signalpost-messenger-v1.prompt.md`: `4dc895d525ecafe7265a439e0661931b94775f1a0a5b245b7cdeadcc04f97291`
- `sips -g pixelWidth -g pixelHeight public/experiences/founders-plot/assets/characters/inhabitants/messenger/rook-signalpost-messenger-v1.png` - passed, `2048x2048`.
- `git diff --check` - passed.

## Caveats

- The current worktree already had unrelated dirty HQ reachability/basic page edits in `server/founders_plot/engine.js`, `public/experiences/founders-plot/founders-plot.js`, `public/experiences/founders-plot/founders-plot.css`, `tests-founders-plot/fp-unit.test.js`, and `e2e/200_founders_plot.spec.js`. This Rook lane did not edit those files.
- A pre-existing untracked `public/experiences/founders-plot/assets/characters/inhabitants/messenger/vell-quill-messenger-v1.prompt.md` remains untouched.
- Rook's asset metadata records the candidate's own `actionMapping` as `work`, but the active game runtime uses the explicit `scene_state.js` mapping and intentionally preserves the existing `ready` row behavior for messenger cues.
