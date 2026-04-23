# Agent Town Release-Candidate Privy Smoke Handoff

## Target branch and worktree

- Branch: `codex/founders-plot-v1-4-3-app-wide-gpt-image2-refresh`
- Worktree: `/private/tmp/portal-founders-plot-v1-4-3-app-wide-gpt-image2-refresh`

This is the release-candidate line to test. Do not use `/Users/robin/Projects/Portal` if it is on a different branch.

## What is already included on this branch

- V1.4.3 app-wide GPT Image 2 asset refresh
- release-candidate copy cleanup
- Town Hall registration -> Brain handoff fix
- standalone Sigil route cleanup:
  - worker reconnect controls restored
  - duplicate Sigil heading chrome removed
  - top illustration crop relaxed

## Environment requirements

Copy the production-like env file into:

- `/private/tmp/portal-founders-plot-v1-4-3-app-wide-gpt-image2-refresh/.env.local`

Important:

- `.env.local` is local-only and should remain uncommitted.
- Do not use the normal `npm test` harness as the primary production-like Privy validation path.
- `playwright.config.js` forces test env behavior and disables real Privy by default.

## Start the release-candidate server

Use the allowed Privy localhost origin:

```bash
cd /private/tmp/portal-founders-plot-v1-4-3-app-wide-gpt-image2-refresh
PORT=4175 STORE_PATH="$(pwd)/data/store.release-smoke.sqlite" npm run dev
```

Reason:

- real Privy worked on `http://localhost:4175`
- a previous run on another port hit Privy local-origin allowlist issues

Health check:

```bash
curl -sf http://localhost:4175/api/health
```

## Real-browser test goal

Run a production-like smoke against:

- `http://localhost:4175/start`

The expected path is:

1. Start Gate
2. real Privy login / registration
3. Town Hall registration
4. Brain configuration
5. Sigil test
6. House / ceremony continuity
7. Founders Plot launch continuity

## Critical current truths

### 1. Privy works on `localhost:4175`

Earlier live verification showed:

- `/api/privy/config` returned `200`
- Privy email-init returned `200`
- the flow advanced to OTP/code entry on the real auth path

So if login fails on another port, treat that as an origin/config issue first, not as a branch regression.

### 2. The current Codex session had Chrome Computer Use problems

The previous long-lived session could not control Chrome via Computer Use because Chrome access was denied at the desktop-control layer.

This is exactly why a fresh session is recommended for the release smoke:

- same branch/worktree
- fresh Codex tool state
- better chance of Computer Use being granted for Chrome

### 3. Brain configuration is client-local by design

The LLM config must remain client-side only.

Expected behavior:

- Brain save/configure completes in the browser
- server receives only onboarding completion and runtime state transitions
- no `/api/agent/lite/llm/config` mutation path should be required

### 4. Sigil route expectations

The standalone Sigil modal should now:

- show the V1.4.3 ceremony illustration cleanly
- show worker reconnect controls
- avoid duplicated title chrome
- allow reconnecting the worker before Sigil matching

If the user reaches Sigil and the worker is still offline, that is a bug or continuity failure.

## Recommended smoke method for the new session

### Preferred

Use Computer Use against Chrome on `http://localhost:4175`.

That new session should:

1. open the RC worktree
2. ensure `.env.local` is present
3. launch the server on port `4175`
4. drive the app in Chrome with real Privy
5. capture screenshots and a short video of the path

### Acceptable fallback

Use direct Playwright/browser automation outside the repo test harness for the real Privy smoke.

Do not treat deterministic `npm test` as a substitute for the real Privy/browser run.

## Minimum success criteria for the smoke

- Start Gate renders the V1.4.3 art baseline
- real Privy login completes
- Town Hall registration completes
- the UI transitions into Brain without getting stranded on Town Hall
- Brain can be configured locally with the chosen provider/model
- the worker becomes connected after Brain setup
- Sigil step shows the worker controls and the agent can mirror the pick
- no raw `agent.panel.*` or `NO_SOLANA_WALLET` strings appear on player-facing routes
- Founders Plot is still reachable after onboarding

## Useful deterministic regression checks already on branch

These are not the production-like smoke, but they are useful sanity checks:

```bash
PW_PORT=4244 npx playwright test e2e/120_onboarding_privy_required.spec.js e2e/196_agent_town_v1_4_3_townhall_brain_visual.spec.js --reporter=line
PW_PORT=4245 npx playwright test e2e/120_onboarding_privy_required.spec.js e2e/197_agent_town_v1_4_3_secondary_surfaces_visual.spec.js --update-snapshots --reporter=line
```

## If the new session finds failures

Bring back:

- exact route
- screenshot
- whether it was real Privy or deterministic test mode
- whether the worker was connected
- any visible raw error text
- whether the failure happened before or after Brain configuration

That is enough context to patch the RC line here without repeating the whole onboarding investigation.
