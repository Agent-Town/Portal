# Experience flow (UX)

## Pages

1. **Home** (`/`)
   - Shows hero copy + 2×3 benefits.
   - Shows Team Code and “Read the skill” CTA.
   - Shows agent connection status.
   - Step 2: Sigil match (human click, agent API).
   - Step 3: Beta press (both must press).

2. **Create** (`/create`)
   - 16×16 pixel canvas.
   - Human paints via click.
   - Agent paints via API.
   - “Lock in + generate share link” creates a permanent `/s/:id` view.
   - Post links are added after the share link is created.

3. **Share (public)** (`/s/:id`)
   - Read-only share page.
   - Shows snapshot.
   - Shows team names + post links.

4. **Share (manage)** (`/share/:id`)
   - Shows share URL + copy button.
   - Shows snapshot and lets humans add post links.
   - Opt-in prompt: only lists on leaderboard if both choose yes.

5. **Leaderboard** (`/leaderboard`)
   - Shows total signups count.
   - Shows opted-in teams and their post links.

---

## Primary cooperative mechanic: Match

- The UI presents a fixed set of sigils: `key`, `cookie`, `booth`, `wolf`, `map`, `spark`.
- The human selects a sigil by clicking.
- The agent selects a sigil by calling `/api/agent/select`.
- If both selections match, the lock state becomes **UNLOCKED**.

---

## Secondary cooperative mechanic: Co-press beta

- After unlock, the human enters email and clicks **Get Beta Access**.
- The agent must also press via `/api/agent/beta/press`.
- Only when both have pressed is the signup recorded and `/create` allowed.

---

## Privacy + leaderboard opt-in

- The leaderboard is opt-in.
- Only if both human and agent set `appear: true` does the team appear publicly.
- Otherwise the only “public” thing is the share link itself.

---

## Accessibility and minimalism

- No scrolling required to complete the flow on common desktop widths.
- Copy is short; every step is clear.
- Minimal controls: no dashboards, no multiple CTAs.

---

## Acceptance criteria (human-visible)

- Home shows Team Code within 1 second.
- Home shows agent connection status.
- Selecting matching sigils unlocks beta state.
- After both press beta, the browser navigates to `/create`.
- On create page, agent painting is visible to human.
- Share page displays a stable share URL.
- If both opt in, leaderboard shows a new entry.

(See Playwright tests in `e2e/`.)
