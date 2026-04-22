# GAME_UX.md Patch — V1.4.2 Acceptance Cleanup

Apply this patch conceptually to the canonical `GAME_UX.md`.

---

## Add section: V1.4.2 route-level acceptance cleanup

The V1.4.2 GPT Image 2 art baseline is accepted. The next UX cleanup focuses on the live route, not a broad art rebuild.

### The five-second rule

A player must be able to answer within five seconds:

1. What kind of game is this?
2. What is the next thing to do?
3. Where is Clover?
4. What object matters right now?

### Attention hierarchy

The screen may have only one dominant objective owner.

Priority order:

1. blocking approval or error;
2. current objective / tutorial milestone;
3. ready-to-turn-in contract;
4. active Foreman action;
5. selected object action;
6. secondary available lots;
7. ambient labels.

If two systems compete, the lower-priority system must become a badge, tooltip, drawer item, or journal entry.

### Mobile label rules

On mobile default route:

- hide non-objective `Build here` labels;
- show at most one strong objective label;
- use icons/stakes for quiet available lots;
- move detail copy into bottom sheets;
- no visible clipped labels.

### Clover action UX

Clover must visibly act in the world without relying on the Foreman drawer.

When Clover acts:

1. Clover is grounded in the scene;
2. the target object is linked/highlighted;
3. the action feedback appears near the world object;
4. a one-line receipt appears after completion;
5. detailed audit remains expandable.

### HQ upgrade UX

HQ upgrades are emotional progress moments.

At least HQ Level 1, Level 3, and Level 5 must read as distinct states in the scene.

### Scene layering UX

Use background plates for atmosphere and live object layers for state. If a building can be placed, upgraded, locked, producing, or targeted by Clover, it cannot be only baked into the scene background.
