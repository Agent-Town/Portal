# Phase D3 - District Modal Shell TDD Spec

Status: Draft

## 1. Goal

Unify the district modal shell so it feels like one calm frame containing content, rather than a stack of competing frames.

Affected surfaces:

1. House
2. Town Hall
3. Pony
4. Leaderboard
5. Saloon
6. Brain
7. Trainer modal if visually affected by shared shell decisions

## 2. Scope

Primary files:

1. `public/styles.css`
2. `public/index.html`
3. `public/views/house.html`
4. `public/views/townhall.html`
5. `public/views/pony.html`
6. `public/views/leaderboard.html`
7. `public/views/saloon.html`
8. `public/views/brain.html`

## 3. Non-goals

1. changing district content logic,
2. changing district ordering,
3. changing modal routing or modal-first architecture.

## 4. Measurable acceptance criteria

1. modal shell visually recedes relative to the content it contains,
2. inner panels no longer all look equally primary,
3. close control is obvious but not dominant,
4. each district surface can establish one clear primary region in the first screenful,
5. modal content remains usable at mobile, tablet, and desktop,
6. no modal content clips behind the agent sidebar or safe area.

## 5. Evidence requirements

Required captures:

1. House modal desktop and mobile,
2. Town Hall desktop and mobile,
3. at least one simple district like Pony or Leaderboard for consistency proof.

## 6. Verification

1. targeted modal and district Playwright coverage,
2. full `npm test`,
3. no regression in district open/close continuity.

## 7. Exit criteria

This phase is complete only when:

1. the modal shell stops fighting the content,
2. each district begins with a more obvious hierarchy,
3. the app still feels like one product, not several unrelated panel stacks.

