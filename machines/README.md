# Machines

Status: formal-state scaffolds for Agent Town / ZHC0  
Last updated: 2026-03-16

This directory is for **formal or machine-readable product state models**.

Purpose:

1. define important product/protocol states explicitly,
2. prevent backend/frontend/design drift,
3. provide a bridge between narrative docs and executable tests,
4. prepare for future TLA+/`tla-precheck`-style verification where it adds real value.

## Current rule

A machine in this directory should define:

1. state variables,
2. allowed transitions,
3. invariants,
4. impossible states,
5. references to the matching UI projection spec and TDD contract.

## Important note

The initial machine files here are **scaffolds**, not yet wired into an automated proof/build pipeline.

That is intentional.

The sequence is:

1. write the state model,
2. validate it against product/design intent,
3. then connect it to a formal toolchain if/when we adopt one in-repo.

## Current artifacts

- `FoundersLoop.machine.ts`
  - TypeScript machine scaffold for the first playable ZHC0 loop
- `FoundersLoop.tla`
  - TLA+ state-machine artifact for the founders loop
- `FoundersLoop.cfg`
  - TLC configuration for invariants

## Related docs

- `docs/founders-loop-state-model.md`
- `docs/zhc-formal-spec-strategy.md`
- `docs/zhc-spec-stack.md`
- `design/specs/10_founders_loop_ui_state_projection.md`
- `specs/43_zhc0_founders_loop_state_contract.md`
