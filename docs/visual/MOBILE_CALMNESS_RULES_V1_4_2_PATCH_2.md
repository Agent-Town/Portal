# Founders Plot V1.4.2 Patch 2 — Mobile Calmness Rules

## Purpose

This document defines the mobile presentation law for Founders Plot after the V1.4.2 GPT Image 2 rebuild.

The 390px route must feel like a game surface, not a compressed annotated map.

## Core rule

On mobile, **the scene should breathe**.

The default route may show:

1. one short objective;
2. one primary action;
3. one objective/recommended world marker;
4. Clover only when relevant;
5. selected-object detail only after selection.

Everything else must be quiet, iconified, hidden, or moved into the bottom sheet.

## Visibility matrix

| Signal | Desktop default | Mobile default | Mobile selected | Mobile Clover acting |
|---|---|---|---|---|
| Objective lot label | visible/loud | visible/loud | visible if selected or objective | visible if target |
| Non-objective available lot | quiet label allowed | icon/stake only | label only if selected | icon/stake only |
| Locked lot reason | quiet label allowed | hidden; show on select | visible in sheet | hidden unless target |
| Build here text | allowed for recommended only | forbidden except objective lot | in sheet | forbidden unless target |
| Contract/Civic label | visible if relevant | hidden or icon-only | in sheet | hidden |
| Clover speech | visible when relevant | one line max | one line max | one line max |
| Resource flyout | visible | visible but brief | visible but brief | may show only if not competing with target link |
| Ready badge | visible | only for objective/selected | visible | visible only if target |
| Timer badge | visible | only selected/critical | visible | suppressed if target link active |

## Mobile text budget

- Persistent world labels: **3 max**.
- On-map visible words: **24 max**.
- Non-objective text labels: **0**.
- Clipped labels: **0**.

## Priority arbitration

When signals conflict, keep the highest-priority signals and suppress the rest.

1. Blocking approval / critical warning
2. Current objective marker
3. Clover acting target link
4. Selected object label
5. Resource flyout
6. Ready / blocked badge
7. Ambient / flavor label

## Anti-patterns

Do not ship:

- repeated `Build here` pills;
- multiple same-weight white chips;
- labels that partially clip at 390px;
- objective text repeated in top bar, stage label, and bottom sheet at once;
- Clover speech + flyout + badge + label stacked over the same building;
- mobile route that looks like a debug overlay over art.

## Review question

A reviewer should be able to look at the 390px screenshot for five seconds and answer:

> What should I do next?

If the answer is not immediate, the mobile screen fails.
