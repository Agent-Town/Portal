---
schemaVersion: "agent-town-doc-path-decision-v1"
title: "Source-of-Truth Design Document Path Decision"
status: "recommended"
date: "2026-05-24"
---

# Source-of-Truth Design Document Path Decision

## Problem

`AGENTS.md` and several sprint specs reference root files:

- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`

Some current checkouts instead store the canonical files under:

```text
Brand kit/guidelines/agent-town-design-pack/
```

Future AI implementers should not have to guess which path is canonical.

## Decision

Use root redirect stubs unless the repo maintainers prefer moving the canonical files to root.

## Required Root Files

Add root files:

- `BRAND.md`
- `DESIGN.md`
- `GAME_UX.md`
- `REGISTRY.md`

Each root file should contain:

```md
# <Document Name>

Canonical source:

`Brand kit/guidelines/agent-town-design-pack/<Document Name>.md`

Read that file before making product/UI changes.
```

## Alternative

If root stubs are not desired, update every read-order list in `AGENTS.md` and future specs to reference the nested paths directly.

## Acceptance Test

Add a small Node test:

- root design docs exist;
- each root doc either contains canonical content or redirects to an existing nested file;
- `AGENTS.md` read-order references only paths that exist.
