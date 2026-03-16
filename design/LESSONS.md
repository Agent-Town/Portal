# Design Lessons

## Current Lessons

### 1. Production truth beats aspirational docs

The live UI is governed by [public/styles.css](/Users/robin/.codex/worktrees/afe5/Portal/public/styles.css), not by the Brand kit.

Any design pass that starts from the Brand kit without reconciling production first will create more drift.

### 2. The shell is the product

The town hub and modal-first navigation are not cosmetic choices. They protect worker continuity and give the product its identity.

### 3. Debug is required, but it is not the hero

The agent panel must remain present and observable. The design job is to make it subordinate, not invisible.

### 4. Hierarchy beats decoration

Most current UI problems come from equal emphasis, not lack of visual effects.

### 5. Expressive typography must be used sparingly

The western character of the product is valuable, but when the display face is also the body face, the result becomes busy and tiring.

### 6. Mobile is the truth serum

If a design feels crowded or ambiguous on mobile, it is usually structurally wrong, not merely in need of breakpoint tweaks.

### 7. English-first is not the same as English-only

If a hierarchy, button label, or layout only works in English, it is not ready for this product.

### 8. Voice readiness starts with naming

Future voice support is not only a speech-tech problem. It starts with short, plain-language control labels and clear step structure.

### 9. One focus card is stronger than ambient emphasis

On the town hub, the map, labels, status copy, and dock were all competing. A single focus card with one dominant action makes the shell readable without changing functionality.

### 10. Mixed-script readiness starts in the font stack

If the readable UI layer does not include sane CJK fallbacks, mixed Latin and Simplified Chinese copy will look accidental even when layout technically fits.

### 11. Support copy must sit below the action, not beside it

Status text works best as subordinate reassurance. When support text is styled like another headline or pill, it competes with the primary decision instead of helping it.

### 12. Debug availability does not require visual dominance

The agent dock can stay one click away while using quieter materials, smaller type, and fewer visible controls at rest. People only need the tool when they decide to reach for it.

### 13. The assistant should carry detail, not the first viewport

If the assistant is already with the user, the UI does not need to expose every valuable detail by default. Summary-first design plus structured advanced layers is better than either a dense dashboard or a stripped-down UI that hides useful evidence completely.

### 14. Simplicity is not deletion

The right fix for rich operational data is usually staging, grouping, and disclosure. Deleting detail breaks trust. Showing everything breaks usability.

### 15. Design drift is a product bug

If the design docs, screenshots, tests, and shipped UI disagree, the team starts designing against fiction. The right habit is a small design loop with one source of truth and visible proof at each step.

### 16. Formal methods are for interaction logic, not taste

TLA+ is useful for proving state and disclosure rules like summary-before-detail or modal continuity. It is not a substitute for screenshot review, spacing judgment, or typography quality.
