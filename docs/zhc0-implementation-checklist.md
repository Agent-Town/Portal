# ZHC0 Implementation Checklist

Status: working delivery plan  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

This is the concrete build checklist for the **first playable zero-human-company loop**.

## 1. Delivery principle

We are not trying to finish Agent Town.
We are trying to make the first loop **playable fast**.

Success means a new person can:

1. enter in browser,
2. meet or hatch an agent,
3. found the team,
4. establish HQ,
5. do one meaningful mission,
6. save one meaningful memory,
7. see what comes next.

If a task does not help that, it is probably not ZHC0 work.

---

## 2. Hard constraints

1. Keep the product **browser-first**.
2. Keep the core loop **OpenClaw Lite-compatible**.
3. Keep the core flow **non-technical by default**.
4. Use **real platform actions** whenever possible.
5. Avoid giant branch merges.
6. Prefer **manual porting** for messy UI ideas.
7. Prefer **cherry-picking** for clean implementation commits.
8. Write down new ideas as they appear; do not trust memory.

---

## 3. First playable loop

### Step 1 — Enter town

Target outcome:
- `/start` gives one obvious first action
- the user understands they are entering Agent Town to build with an agent

Checklist:
- [ ] simplify first paint of `/start`
- [ ] make CTA stronger and more inevitable
- [ ] reduce “mystery media frame” problem
- [ ] make the opening line outcome-first, not infra-first
- [ ] keep login/auth friction as low as possible

Acceptance:
- a new user can explain what to do next in under 2 seconds

### Step 2 — Meet or hatch the first agent

Target outcome:
- the user feels they are bringing their first worker online

Checklist:
- [ ] hide advanced provider/model talk behind secondary controls when possible
- [ ] make the default brain setup feel guided
- [ ] decide what the minimum starter setup is for public users
- [ ] document what happens if no key/provider is configured yet

Acceptance:
- the user understands “this is my agent” before they understand model/provider details

### Step 3 — Found the team

Target outcome:
- Town Hall feels like founding the company, not filling a form

Checklist:
- [ ] rewrite Town Hall copy around founders/team/HQ
- [ ] simplify sequencing of human + agent naming steps
- [ ] keep the ceremony feeling guided
- [ ] remove or visually bury irrelevant complexity during first pass

Acceptance:
- user can say “we founded our team” after Town Hall

### Step 4 — Prove alignment

Target outcome:
- sigil/open flow feels like a meaningful partnership gate

Checklist:
- [ ] clarify why this step exists in plain language
- [ ] keep the action small and satisfying
- [ ] make completion feedback obvious

Acceptance:
- user understands they just proved co-op alignment

### Step 5 — Create the company crest

Target outcome:
- `/create` feels like making a founding symbol, not just entropy generation

Checklist:
- [ ] frame the pixel canvas as the company crest / seal
- [ ] keep the action playful but fast
- [ ] make the “continue” outcome clear

Acceptance:
- user feels they created a thing worth keeping

### Step 6 — Open HQ

Target outcome:
- House reads as headquarters

Checklist:
- [ ] make House framing more HQ-like
- [ ] make the first relevant rooms clearer
- [ ] suppress low-priority surfaces during first entry if needed
- [ ] decide what the first visible House action should be

Acceptance:
- user can say “this is our HQ” within the first screenful

### Step 7 — Run the first mission

Target outcome:
- the user and agent do one real piece of work together

Recommended first mission lane:
- **Web Ops / market research mission**

Checklist:
- [ ] define one canonical mission
- [ ] define mission brief UI
- [ ] define success condition
- [ ] ensure mission uses real platform primitives, not fake tutorial-only state
- [ ] keep approvals/evidence visible but non-scary

Acceptance:
- user completes one meaningful action and sees the result

### Step 8 — Save first memory

Target outcome:
- the pair stores their first useful knowledge in Library
- the product makes it clear that the user-agent conversation is part of the company’s seed memory

Checklist:
- [ ] make “save this to company memory” trivial
- [ ] allow the first saved memory to come from the mission outcome and/or the user-agent discussion that produced it
- [ ] minimize Library complexity on first entry
- [ ] choose sensible default shelf / memory destination
- [ ] ensure this feels rewarding, not clerical
- [ ] preserve a path toward config/mind capture as a later save-point mechanic

Acceptance:
- user saves one artifact/note/conversation capture and understands why it matters

### Step 9 — Show next quest

Target outcome:
- the system tells the pair what comes next

Checklist:
- [ ] use Tracks or a first-quest board
- [ ] make the next step obvious
- [ ] avoid giant dashboards
- [ ] connect progress to real completed actions

Acceptance:
- user leaves the first loop knowing the next recommended move

---

## 4. What to cut or hide in ZHC0

For the first playable loop, hide or de-emphasize anything that causes premature confusion:

- provider comparison overload
- model taxonomy overload
- too many districts at once
- deep library admin actions
- multi-office fantasies not yet implemented
- advanced trainer/debug controls in the primary path
- marketplace complexity before first mission

Rule:
- complexity may exist
- it does not need to dominate the first hour

---

## 5. Branch borrowing rules

### Use as base
- `origin/codex/frontend-design`

### Borrow selectively from
- `origin/codex/poker-frontend-design-v1`
  - only if a concrete poker UI pattern becomes useful
- `origin/codex/house-office-frontend`
  - only if a House/HQ/office idea sharpens the HQ feeling
- `origin/codex/frontend-design-system-v0-1`
  - only for tokens, component rules, or clean design-system material

### Do not do
- [ ] do not mass-merge all parallel frontend branches
- [ ] do not import complexity just because it exists
- [ ] do not let secondary experiences derail the founders loop

---

## 6. Public-user assumptions to validate

We need to validate what a normal user really has.

### Likely true
- [ ] browser
- [ ] email or low-friction login path
- [ ] tolerance for one guided setup sequence
- [ ] no desire to touch a terminal

### Risky assumptions
- [ ] user has their own LLM API key
- [ ] user understands model/provider differences
- [ ] user is willing to self-host day one
- [ ] user is comfortable debugging auth/provider errors

### Product implication
- ZHC0 should work as far as possible with **hosted defaults + simple choices**

---

## 7. Dogfooding checklist

We should use the product like future users will.

- [ ] use browser-first flow ourselves
- [ ] use Lite runtime path
- [ ] avoid secret CLI-only setup for the core loop
- [ ] note every place where operator knowledge is still required
- [ ] note every place where provider/model setup becomes confusing
- [ ] note every place where House/Library feels too dense
- [ ] note every place where the product stops feeling like a game and starts feeling like admin software

---

## 8. Immediate implementation order

Recommended order:

1. `/start` opening rewrite
2. Town Hall founder framing
3. sigil/create copy and continuity cleanup
4. House = HQ first-entry framing
5. define first mission lane
6. define first memory save flow
7. define next-quest/progression surface

This order matters because it gets us to playable faster than doing general UI cleanup first.

---

## 9. Definition of “first playable”

ZHC0 is first playable when:

- [ ] a new user can complete the full founders loop in browser
- [ ] the loop uses real platform state/actions
- [ ] no terminal is required
- [ ] the first mission is understandable
- [ ] one memory is saved to Library
- [ ] one next quest is visible
- [ ] the product feels like founding something with an agent

If all of that is true, ZHC0 exists.

If not, we are still building infrastructure.
