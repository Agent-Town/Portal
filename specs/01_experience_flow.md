# Experience flow (UX)

## Pages

1. **Home** (`/`)
   - Shows hero copy + 2×3 benefits.
   - Shows Team Code and “Read the skill” CTA.
   - Shows agent connection status.
   - Step 2: Sigil match (human click, agent API).
   - Step 3: Open press (both must press).
   - If a house already exists for the session, replace Steps 1–2 with a **Reconnect to House** panel.

2. **Create** (`/create`)
   - 16×16 pixel canvas.
   - Human paints via click.
   - Agent paints via API.
   - “Lock in + generate house QR” completes the co-op ceremony and creates the house.

3. **House** (`/house?house=...`)
   - Unlock with wallet signature.
   - Generate a share link for the team.
   - Optional: upload a public image + prompt (not encrypted) for the leaderboard.

4. **Share (public)** (`/s/:id`)
   - Read-only share page.
   - Shows team names + post links.
   - Shows public house image + prompt (if uploaded).

5. **Leaderboard** (`/leaderboard`)
   - Shows total signups count.
   - Shows teams with share links and their post links.

---

## Primary cooperative mechanic: Match

- The UI presents a fixed set of sigils: `key`, `cookie`, `booth`, `wolf`, `map`, `spark`.
- The human selects a sigil by clicking.
- The agent selects a sigil by calling `/api/agent/select`.
- If both selections match, the lock state becomes **UNLOCKED**.

---

## Secondary cooperative mechanic: Co-press Open

- After unlock, the human clicks **Open**.
- The agent must also press via `/api/agent/open/press`.
- Only when both have pressed is the signup recorded and `/create` allowed.

---

## Leaderboard visibility

- Teams appear on the leaderboard after a share link is created.

---

## Accessibility and minimalism

- No scrolling required to complete the flow on common desktop widths.
- Copy is short; every step is clear.
- Minimal controls: no dashboards, no multiple CTAs.

---

## Acceptance criteria (human-visible)

- Home shows Team Code within 1 second.
- Home shows agent connection status.
- Selecting matching sigils unlocks the lock.
- After both press Open, the browser navigates to `/create`.
- On create page, agent painting is visible to human.
- Share page displays a stable share URL.
- Creating a share link adds the team to the leaderboard.

(See Playwright tests in `e2e/`.)
