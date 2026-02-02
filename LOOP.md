# RALPH loop (Codex CLI)

This repo is structured to support a strict TDD loop.

## Recommended loop

1. Read specs in `specs/`.
2. Run tests: `npm test`.
3. Fix only what the failing test requires.
4. Repeat.

## Using Codex CLI in non-interactive mode

Codex supports scripted runs via `codex exec` and can read the prompt from stdin using `-`.

Example:
```bash
git init  # Codex expects a git repo by default
npm install
codex exec --full-auto - < PROMPT_build.md
```

- `--full-auto` lets Codex edit files inside the workspace.
- If you intentionally want to run outside git, you can add `--skip-git-repo-check`.

## Helper script

`./loop.sh` is a convenience wrapper around the command above.
