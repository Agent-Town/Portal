# Start Gate / Privy to Founders Plot Flow — V1.4.4 Cleanup

## Desired flow

```text
Start Gate
  ↓
Privy login / test-auth fixture
  ↓
/app?district=founders-plot&entry=play-first
  ↓
Founders Plot game shell
  ↓
Manual Founder Mode
```

## What must not block this flow

- Brain connection
- Town Hall registration
- Sigil / Ceremony
- ERC-8004 setup
- provider/model/API-key configuration

## What still requires Brain

- Real Clover Foreman actions
- AGENT-attributed tool mutations
- OpenClaw Lite / LLM-mediated Foreman runtime behavior

## What still belongs in Town Hall later

- full identity ceremony
- public profile
- ERC-8004/passport-style registration
- advanced agent identity settings
- deeper autonomy/governance settings

## Test requirement

A Playwright test must start at the Start Gate path, complete/simulate auth,
and prove Founders Plot is playable in Manual Founder Mode.
