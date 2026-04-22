# GAME_UX.md Patch — V1.4.2 Patch 2

Add this section to the canonical `GAME_UX.md`.

---

## Founders Plot Mobile Attention Arbitration

On mobile, the player must always know one thing first:

> What should I do next?

The default mobile route must not show multiple competing world labels. The objective, selected object, and Clover action may speak. Everything else must wait.

### Mobile default state

The 390px default route should show:

1. compact resource/status HUD;
2. one concise objective;
3. scenic plot;
4. one objective/recommended object marker;
5. one primary action via sheet or CTA.

### Mobile selected state

After selecting an object, the bottom sheet may carry the text burden. The stage should remain visually calm.

### Mobile Clover acting state

When Clover acts:

- Clover must remain visible;
- the target object must be visually linked;
- no large Foreman drawer should be required to understand the action;
- target-area feedback must not stack more than two competing signals.

### HQ upgrade emotional rule

An HQ upgrade must feel like a settlement milestone, not a number change. At minimum, HQ levels 1, 3, and 5 must be visibly distinct without labels.

### Five-second mobile test

Show the 390px screenshot for five seconds. A reviewer must be able to answer:

1. What game is this?
2. What is the next action?
3. Which object matters now?
4. Where is Clover / what is Clover doing, if relevant?

Failure to answer these means the mobile screen fails even if automated metrics pass.
