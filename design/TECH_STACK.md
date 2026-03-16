# TECH_STACK

Status: technical context for design agents
Last updated: 2026-03-16

This file explains what the current stack can support, what it cannot support easily, and what that means for design work.

## 1. Current stack

Application:

1. Node.js
2. Express
3. SQLite for persistence
4. vanilla HTML/CSS/JS front end
5. Playwright for acceptance testing
6. in-browser OpenClaw Lite worker runtime

Key package references:

1. `express`
2. `@playwright/test`
3. `ethers`
4. `@solana/web3.js`

## 2. Front-end implementation reality

The front end is not React, Vue, or Svelte.

Design implications:

1. no component framework abstraction layer,
2. markup changes happen directly in HTML or generated DOM,
3. styles are centralized in `public/styles.css`,
4. some visual state is driven in `public/app.js`,
5. many surfaces use existing `data-testid` hooks that must remain stable.

## 3. Modal-first runtime constraint

The worker runtime is page-scoped.

Design implication:

1. full page navigations can interrupt worker continuity,
2. modal and in-place surfaces are preferred,
3. designs should reuse the `/app` shell where possible,
4. any design proposal that assumes route replacement must be treated as a higher-risk change.

## 4. What the stack can support well

1. CSS-driven responsive layout,
2. progressive disclosure with drawers and details elements,
3. modal overlays,
4. light motion and transitions,
5. careful typography and spacing refactors,
6. consistent button, card, and token systems,
7. screenshot-driven Playwright evidence,
8. accessible labels, focus states, and keyboard affordances.

## 5. What the stack can support, but with care

1. large-scale markup reordering in dense shells,
2. mobile-first responsive redesign in the town hub and House surfaces,
3. calmer sidebar behavior,
4. layout rebalancing between world shell and inner modal content.

These require careful regression testing because `public/app.js` wires many UI behaviors by id and existing structure.

## 6. What the stack should not be asked to do casually

1. framework migration,
2. route-level navigation redesign,
3. functionality changes disguised as visual changes,
4. logic moved from JS runtime into backend templates,
5. animation-heavy interfaces that fight the worker/debug shell and mobile performance.

## 7. External integrations that affect design

1. Privy login on `/start`
2. YouTube embed in the start hero
3. wallet flows and live provider surfaces
4. agent sidebar and debug tools

Design implication:

1. third-party embeds can fail or load slowly,
2. the design must degrade gracefully,
3. empty or loading states must feel intentional.
4. because the app already has an in-product LLM, the UI does not need to expose every available detail directly.

## 7.1 Internationalization and provider flexibility implications

The product will need to support:

1. different languages,
2. different regional users,
3. different AI models and providers,
4. future region-specific service choices.

Design implication:

1. core layout should not depend on one provider brand,
2. primary flows should not be built around provider-specific wording,
3. text containers must tolerate localization,
4. design choices should assume English and Chinese are both important,
5. detailed system information can remain available to the LLM and advanced views while the default human UI stays simpler.

## 7.2 Future voice implications

Voice control is not the current primary implementation.
It is a future constraint.

Design implication:

1. controls need stable names,
2. rooms and panels need obvious identities,
3. ambiguous icon-only action clusters should be avoided,
4. visual confirmation states matter because voice flows will need them later,
5. summary-first UI helps voice and LLM explanation scale better than detail-heavy screens.

## 8. Test and verification environment

Primary commands:

1. `npm run dev`
2. `npm test`
3. `npx playwright test <file>`

Useful test-mode server pattern for screenshot and audit work:

```bash
NODE_ENV=test TEST_RESET_TOKEN=test-reset PORT=4212 npm run dev
```

This allows deterministic reset and seeded screenshot capture without modifying product behavior.

## 9. Design implementation rule

If a design improvement requires:

1. a new route,
2. a new API,
3. new persisted state,
4. new product semantics,

then it is not a pure design task anymore.
It must be flagged separately.
