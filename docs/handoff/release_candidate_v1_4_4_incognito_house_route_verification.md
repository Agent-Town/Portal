# V1.4.4 RC Incognito House Route Verification

## Purpose

This handoff closes the RC smoke gap where normal Chrome sessions could carry old `et_session` cookies or local browser state into `/app?district=house` checks.

Do not use an already-open normal browser profile as proof of House route continuity.

## Required manual smoke rule

A clean browser with no completed house session must behave like this:

```text
Chrome Incognito
http://localhost:4175/app?district=house
=> http://localhost:4175/start
```

That redirect is correct. It proves the browser is clean and no old completed house session leaked into the run.

## Valid post-house verification paths

Use one of these:

1. Complete the full real browser RC path in the same incognito session.
2. Use the deterministic isolated-context seed path documented below.

The full real browser path is:

```text
Start Gate
Privy login
Town Hall
Brain
Sigil
Ceremony
House
reload /app?district=house
```

The deterministic seed path is:

```text
new empty browser context
seed/create recoverable test house through the context-owned session
open /app?district=house
reload /app?district=house
force stale onboarding.step = ceremony while preserving houseId
verify Plan Wagons/House remains open
```

## Automated proof

Run:

```bash
PW_PORT=4175 npx playwright test e2e/213_rc_incognito_house_route_verification.spec.js --reporter=line
```

The test writes screenshot evidence to:

```text
/tmp/portal-screenshots/rc-incognito-house-deeplink-start.png
/tmp/portal-screenshots/rc-incognito-seeded-house-route.png
/tmp/portal-screenshots/rc-incognito-stale-ceremony-house-route.png
```

## Related regression tests

Keep these green:

```bash
npx playwright test e2e/120_onboarding_privy_required.spec.js e2e/38_phase1_create_ceremony_regression.spec.js
```

These prove stale ceremony state and ceremony key-wrap signing, but they do not replace the clean-context verification test above.
