# Brain Mode and Onboarding Copy Decision — V1.4.4 Cleanup

## Decision

Founders Plot is playable without a Brain.

Real Clover Foreman requires a real connected Brain/runtime.

Free, no-op, mock, or basic preview Brain modes must not be treated as production Real Clover
unless explicitly product-owner-approved by configuration.

---

## Product modes

| Mode | What the player can do | What Clover can do | Copy direction |
|---|---|---|---|
| Manual Founder Mode | Build, collect, accept starter goals manually | Guide basics, explain UI, no AGENT mutations | “Build manually now. Connect a Brain when you want Clover to reason and act.” |
| Preview Clover | See limited guidance with test/free/basic Brain | Suggest/explain only; no production AGENT mutations | “Preview guidance only. Real Clover actions require a connected Brain.” |
| Real Clover Foreman | Use Clover as an AI gameplay partner | Observe, reason, choose safe candidates, act through protected tools | “Clover is ready to reason and act through approved tools.” |
| Town Hall / Make it official | Full identity/onboarding | Deeper identity/governance setup | “Visit Town Hall to make your role official.” |

---

## Why this matters

The first session should not ask users to configure the full agent stack before they have felt the game.

But the product must also stay honest.

Real Clover is the differentiator and should not be faked by a weak/free/test placeholder.

---

## Recommended UI copy

### Manual Founder Mode

```text
You can build manually now.
Clover will guide the basics. Connect a Brain when you want Clover to reason and act as your Foreman.
```

### Preview Clover

```text
Preview guidance only.
Real Clover actions require a connected Brain.
```

### Real Clover

```text
Clover is ready.
Your Brain is connected, and Clover can act through approved tools.
```

### Brain required guard

```text
Connect a Brain to let Clover act as your Foreman.
```

---

## Implementation notes

- Normal plot gameplay should avoid provider/model jargon.
- Brain sheet may show provider/model/API-key details.
- Production must not default to a `:free` provider model for Real Clover.
- Test/local may use deterministic Test Brain fixtures, but tests must label that path clearly.
