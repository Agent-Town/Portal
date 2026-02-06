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
