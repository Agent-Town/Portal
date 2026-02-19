# Copy/Paste Prompt For Next Session

Use this prompt to continue work in a fresh Codex session:

```text
You are continuing work in:
/Users/robin/Projects/Portal-claw-lite

Start by reading:
1) /Users/robin/Projects/Portal-claw-lite/AGENTS.md
2) /Users/robin/Projects/Portal-claw-lite/docs/internal-skill-adoption-gaps.md
3) /Users/robin/Projects/Portal-claw-lite/docs/internal-skill-testline.md
4) /Users/robin/Projects/Portal-claw-lite/docs/internal-session-handoff.md

Then run `git status` first and do not revert unrelated local changes.

Current branch:
- hatch-openclawlite

Recent important commits:
- 7a47be7 feat(skill): align lite skills prompt registry and import metadata normalization
- 7827f97 fix(oauth): resolve pkce state mismatch across retries

Known-good regression subset (passed on 2026-02-18):
- npx playwright test e2e/01_home.spec.js e2e/53_agent_panel_global_presence.spec.js e2e/56_phase3_skill_visit_worker.spec.js e2e/57_phase3_onboarding_wallet_llm_persist.spec.js

Critical constraints:
- Worker-first architecture only. No backend shortcuts/bypasses for agent behavior.
- Keep UI minimal and local-first.
- Team Code stays internal/minimal in UI.
- Preserve debug panel tabs and traffic card/filter behavior.
- Preserve OpenAI Codex PKCE flow and state-based stale-attempt recovery; do not accept id_token callback URLs.
- If changing worker behavior required by skill files, add deterministic Playwright coverage first.
- Rebuild Lite artifacts after vendor source edits: npm run build:openclaw-lite

Primary next priorities:
1) Continue docs/internal-skill-testline.md “Next Planned Expansions”:
   - multi-skill conflict/tie-break tests
   - Moltbook cross-origin import refresh/etag tests
   - reusable multi-experience compatibility matrix tests
2) Keep docs updated as progress changes.

If you need a product/technical decision while exploring, ask before implementing.
```
