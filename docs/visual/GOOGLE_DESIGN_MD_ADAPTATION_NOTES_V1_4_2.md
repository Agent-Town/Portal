# Google `design.md` Adaptation Notes for Agent Town V1.4.2

Google's `design.md` format is useful because it treats design as both machine-readable tokens and human-readable rationale.

Agent Town adopts the pattern without replacing the existing doc set:

- `DESIGN.md` becomes tokenized and lintable.
- `BRAND.md` remains product/character/tone law.
- `GAME_UX.md` remains interaction and hierarchy law.
- `REGISTRY.md` remains component/block/asset contract governance.
- Sprint specs define the active implementation target.

## What to copy from the format

- YAML front matter at the top of `DESIGN.md`.
- Tokens for colors, typography, spacing, rounded shapes, and components.
- Markdown rationale after the tokens.
- Lint/diff mindset for future changes.

## What not to copy blindly

Agent Town is a game, not a normal app. `DESIGN.md` must also include:

- game-stage law;
- world-object law;
- asset-generation law;
- screenshot signoff;
- prompt provenance;
- hero-cast usage boundaries;
- Clover embodiment rules.

## Optional tooling

If the dependency is installed, run:

```bash
npx @google/design.md lint DESIGN.md
npx @google/design.md diff DESIGN.md DESIGN.previous.md
```

If not installed, use local structural tests from the V1.4.2 TDD matrix.

## Implementation note for V1.4.2

The shipped V1.4.2 rebuild uses a composition-first asset pipeline for gameplay objects:

- generate or recover full-scene references for mood and staging;
- generate compact building, civic-object, and Clover pose sheets;
- promote production objects by cropping and normalizing those sheets into stable route assets;
- keep the cropped object assets under manifest governance with prompt files, hashes, and candidate provenance.

This keeps gameplay composition more stable than relying on one giant fully rendered scene for every route revision. It also makes future building or object replacements cheaper because a single object can be regenerated without throwing away the whole stage.
