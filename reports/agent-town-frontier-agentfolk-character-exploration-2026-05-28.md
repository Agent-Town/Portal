# Agent Town Frontier Agentfolk Character Exploration - 2026-05-28

## Summary

Robin called out that the first frontier-agentfolk sprite set looked like the
same character repeated across roles. That critique is correct.

The fix is not a smaller prompt tweak. The pipeline needs a character
exploration layer before image generation:

1. role gameplay fact;
2. Agent Town story relationship;
3. origin story;
4. visual contrast brief;
5. prompt-ready generation subject;
6. sprite-sheet layout and constraints.

## New Spec

Added:

- `docs/specs/agent-town-frontier-agentfolk-character-exploration.md`

Updated:

- `docs/specs/agent-town-frontier-agentfolk-style-playbook.md`

The style playbook now defines the shared universe, while the new exploration
doc defines how to create a varied cast from that universe.

## Cast Direction

The first proposed cast intentionally separates body type, species/material,
movement, color anchor, and role relationship.

### Mara Boltwick - Builder

Human bridge carpenter and plan-wagon defender. Adult, sturdy, practical,
with a brass-and-teal measuring gauntlet built by the rescued AI agent.

### Kettle-37 - Worker

Compact assay-office machinefolk. Brass furnace body, canvas apron, expressive
shutter lenses, tool arms, warm workshop glow.

### Oona Tallpack - Hauler

Alien freight-runner from the Dust Comet caravan. Four practical arms, rope
harness, long-limbed carrying silhouette, visible load weight.

### Vell Quill - Messenger

Paper-and-light courier printed from the rescued AI agent's damaged plan-wagon
archive. Folded courier-paper body, brass clips, indigo sash, glowing message
core.

## Prompting Change

Old weak pattern:

```text
Make a builder / worker / hauler / messenger in the same Agent Town style.
```

New stronger pattern:

```text
Agent Town world brief
+ server fact
+ role meaning to the player
+ character origin story
+ visual contrast brief
+ animation row behavior
+ no-child / no-clone / no-text constraints
```

This should produce a cast that feels like Agent Town has citizens, not one
generic inhabitant in four outfits.

## Recommendation

Regenerate the role sheets in this order:

1. Worker as Kettle-37, because it most directly breaks the same-character
   problem.
2. Hauler as Oona Tallpack, because body shape and weight-bearing motion should
   make output-ready state legible.
3. Messenger as Vell Quill, because attention/approval/reward UI needs a very
   different paper-and-light visual language.
4. Builder as Mara Boltwick, keeping one strong human anchor.

The current generated sprite sheets can remain temporary fallback assets until
the character-specific sheets are approved.

## Validation

Report/spec-only change. No gameplay code changed.

Run:

```bash
git diff --check
```
