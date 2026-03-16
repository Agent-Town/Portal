# ZHC Design Concept Borrowings

Status: concept translation note  
Last updated: 2026-03-16
Reference inspiration: `https://github.com/kingbootoshi/tla-precheck`

This document records what to borrow from the **TLA PreCheck** concept and what to avoid copying blindly.

## 1. What is compelling about the reference

The strongest thing about the TLA PreCheck concept is **not** the exact visual style.
It is the product communication discipline.

It does several things extremely well:

1. opens with a **sharp thesis**, not a vague vibe,
2. states the **pain** clearly,
3. explains **how it works** in a compact model,
4. shows a **before / after transformation**,
5. defines a **loop**, not just a static product,
6. makes the system feel **serious and trustworthy**,
7. makes complexity feel structured rather than chaotic.

That is the part worth stealing.

## 2. What to borrow for Agent Town / ZHC0

### 2.1 Thesis-first communication

TLA PreCheck opens with one hard promise.

ZHC0 should do the same.

Good pattern:

- one strong line
- one clear outcome
- one obvious next step

Possible ZHC0 thesis directions:

- **Start a company with your agent.**
- **Build a real business with your agent, one mission at a time.**
- **Found your House. Run your first mission. Grow a zero-human company.**

The important thing:
- do not open with general AI/world/lore mush
- open with the user outcome

### 2.2 Problem -> loop -> proof structure

The reference repo communicates in a very effective sequence:

1. here is the pain,
2. here is the mechanism,
3. here is the design loop,
4. here is the result.

ZHC0 should use the same structure.

For Agent Town that becomes:

1. **The problem**
   - most people cannot actually do useful work with an agent without turning into operators
2. **How it works**
   - you and your agent found a House, run missions, save memory, improve
3. **The loop**
   - start -> hatch -> found -> mission -> memory -> next quest
4. **The proof**
   - real mission completed, real memory saved, real progress unlocked

### 2.3 Before / after storytelling

The reference repo makes the transformation legible.

ZHC0 should do the same.

Good ZHC before/after framing:

**Before**
- scattered tools
- random tabs
- prompt spaghetti
- no memory
- no shared HQ
- no clear next step

**After**
- one House
- one agent partner
- one mission loop
- saved company memory
- clear progression
- repeatable improvement

This should become a major storytelling device in landing and onboarding copy.

### 2.4 One source of truth feeling

TLA PreCheck sells “write once, prove once, build from the same source.”

Agent Town should translate that into:

- one House
- one shared memory spine
- one place where the company lives
- one loop from onboarding to operation

For users, the emotional equivalent is:

> I am not juggling random tools. My company lives here.

### 2.5 Serious confidence under a playful shell

The reference feels calm, technical, and trustworthy.

Agent Town should borrow the **confidence**, not the sterile tone.

Target mix:

1. playful world on the outside,
2. serious operational reliability underneath,
3. very little hand-wavy AI hype.

That means:
- the world can be charming,
- the product promises must stay precise.

### 2.6 Loop-based product design

The “design loop” framing is useful.

Agent Town should present a **company-building loop** instead of a feature pile.

Canonical ZHC loop:

1. Found
2. Explore
3. Build
4. Test
5. Save
6. Improve
7. Expand

ZHC0 only needs the first chunk of that loop to be real.

---

## 3. What NOT to copy

### 3.1 Do not copy the cold technical skin literally

TLA PreCheck can afford to look austere because its audience expects a compiler/tool aesthetic.

Agent Town cannot become:

- sterile,
- devtool-first,
- documentation-heavy on first contact,
- emotionally flat.

We need more warmth, place, and guidance.

### 3.2 Do not lead with infrastructure language

The reference can lead with TLA+, compilers, model checking, and guarantees.

Agent Town should not lead with:

- model providers,
- runtime architecture,
- traces,
- embeddings,
- seal/provenance jargon,
- low-level system details.

Those belong behind the curtain.

### 3.3 Do not make the world disappear

The reference is concept-first and highly technical.

Agent Town still needs:

- Town Hall
- House
- Pony
- Registry
- Atlas
- HQ feeling
- world identity

We should borrow the communication structure without flattening the world into SaaS sludge.

---

## 4. Translation into ZHC0 design language

## 4.1 Homepage / start-page structure

Borrow this page logic:

1. **Strong thesis**
2. **The problem**
3. **How it works**
4. **Before / after**
5. **The loop**
6. **Start now**

For ZHC0 that could become:

1. headline: start a company with your agent
2. problem: most people can chat with AI, but cannot build a real operating system with it
3. how it works: found your House, run missions, save memory, improve
4. before/after: chaos vs company HQ
5. loop: founders loop
6. CTA: enter town

## 4.2 In-product onboarding structure

Borrow the same clarity inside the product:

1. where am I?
2. what is this step for?
3. what happens next?
4. what did I just unlock?

The TLA PreCheck concept is very good at making each step feel purposeful.
ZHC0 should aim for the same feeling.

## 4.3 Trust structure

The reference makes strong claims with a clear mechanism.

Agent Town should do the same by grounding trust in:

- real mission results,
- visible memory,
- visible approvals,
- visible evidence,
- clear progression.

In other words:
- do not say “powerful” and leave it at that
- show what the pair actually accomplished

---

## 5. Concrete copy/UX ideas inspired by the reference

### 5.1 Better opener style

Instead of:
- vague lore-first intro

Prefer:
- **Start a company with your agent.**
- **Run your first mission today.**
- **Save what you learn. Build the next step together.**

### 5.2 Better section names

Borrow the clarity of sections like:

- The Problem
- How It Works
- Before & After
- The Design Loop

Translated to Agent Town:

- Why most people never get past AI chat
- How Agent Town works
- Before and after your House
- The founders loop
- Your first mission

### 5.3 Better room framing

Each room should answer a practical question.

Examples:

- Town Hall = who are we?
- House = where do we operate?
- Library = what have we learned?
- Workshop = what are we building?
- Pony = who are we talking to?
- Registry = where do we show up?
- Tracks = what comes next?

This is very aligned with the reference’s clarity.

---

## 6. Design-system implication

The visual style should shift toward:

1. clearer hierarchy,
2. fewer decorative layers competing at once,
3. stronger headline/body contrast,
4. more explicit before/after and step framing,
5. calmer, more trustworthy information layout,
6. less “feature soup” feeling.

The core mood should be:

- confident,
- direct,
- structured,
- but still warm and world-like.

---

## 7. Product strategy implication

The deepest lesson from the reference is:

> do not sell a pile of features — sell a transformation with a loop.

For Agent Town, the transformation is:

- from isolated person using random AI tools
- to a founder operating from a shared House with an agent

That should become the backbone of:

1. landing page design,
2. onboarding copy,
3. quest design,
4. House framing,
5. first mission selection.

---

## 8. Recommendation

Yes — use this concept.

But use it as:

1. **communication architecture**,
2. **loop framing**,
3. **trust/clarity discipline**,
4. **before/after transformation storytelling**.

Do **not** use it as a literal instruction to make Agent Town look like a compiler website.

The right synthesis is:

- TLA PreCheck’s clarity and seriousness
- inside Agent Town’s world, onboarding, and House metaphor
