# Skill spec

The primary skill is delivered as a single markdown file served at:

- `/skill.md`

Optional extension skills may be served at additional paths (e.g. `/skill_agent_solo.md`) and linked from `/skill.md` for agent-only flows.

It contains:

- YAML frontmatter (`name`, `version`, `description`)
- A short explanation of the co-op flow
- Endpoint list + examples
- Recommended agent behavior

The file should stay:

- **Readable** by humans
- **Parseable** by agents (clear headers, code blocks, fixed endpoint paths)
- **Stable** (don’t break backwards compatibility lightly)

Source of truth: `public/skill.md`.

## Additive Internal Packs

Compiled internal packs may add product-specific skill families without changing `public/skill.md`.

Current additive example:

- House Library skill pack at `/api/platform/library/skill-pack`
- compiled entry at `/__compiled/library-skill-pack/skill.md`

These additive packs must:

- preserve the existing internal pack model (`packVersionId`, `contentHash`, manifest file map),
- stay opt-in and experience-specific,
- keep `/skill.md` stable unless a separate milestone explicitly changes it.
