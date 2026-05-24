# Play-First Onboarding Cleanup Notes — V1.4.4

## Product stance

The onboarding refactor is correct.

The game should let a user reach Founders Plot quickly, play manually,
and experience the town before asking them to invest in full setup.

## Final player ladder

```text
Play Now
  The player enters Founders Plot and can play manually.

Connect Brain
  The player unlocks Real Clover as a Brain-backed Foreman.

Visit Town Hall
  The player makes identity, agent profile, and future governance setup official.
```

## What each state means

### Manual Founder Mode

- Human actions only.
- Clover may guide, explain, or point at the current goal.
- Clover must not perform AGENT mutations.
- Brain is not required.

### Demo / Test Brain

- Used for local testing, CI, or preview copy.
- Must not be confused with production Real Clover.
- May demonstrate the interface under explicit test/dev flags.

### Real Clover

- Requires production Brain/runtime readiness.
- Uses OpenClaw Lite / Foreman context path.
- Acts only through server-authoritative tools.
- Emits auditable AGENT events.

## Copy guidance

Use plain player-facing copy.

Do not expose raw provider/debug/runtime jargon in the normal game surface.

Preferred copy examples:

```text
Play manually now. Clover can guide the basics.
```

```text
Log in with ChatGPT to let Clover reason about your town and perform approved Foreman actions.
```

```text
Town Hall is ready when you want to make your role official.
```

Avoid:

```text
LLM runtime unavailable
provider key missing
worker context failure
BRAIN_REQUIRED
```

Raw codes may appear in debug details only.
