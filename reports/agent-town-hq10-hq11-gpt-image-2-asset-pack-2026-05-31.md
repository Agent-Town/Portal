# AgentTown HQ10/HQ11 GPT Image 2 Card-Art Asset Pack - 2026-05-31

## Scope

Integrated the two completed GPT Image 2 card-art source files into repo-owned Founders Plot object assets, then replaced the shared World Grid Civic Beacon fallback art for:

- HQ10B Civic Proposal Records status card
- HQ10C Generated Universe Overlay Packs status card

This lane stayed presentation-only. No server, engine, store, route, tool, scene-state, gameplay, Progression Atlas authority, scheduler, route/trade/spend/share, or external-effect behavior was changed.

## Source Inputs

- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-civic-proposal-dossier-card-art-v1---0a810237-98d4-4817-9125-8df0a71f9296.png`
- `/Users/robin/.openclaw/media/tool-image-generation/agent-town-generated-universe-overlay-pack-card-art-v1---006e565e-963c-41bd-8aff-7236d0085846.png`

Both source images identify as `PNG 1536x1024 8-bit sRGB`.

## Changed Files

- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.generated.png`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.png`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.webp`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.json`
- `public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.prompt.md`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.generated.png`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.png`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.webp`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.json`
- `public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.prompt.md`
- `public/experiences/founders-plot/founders-plot.js`
- `reports/agent-town-hq10-hq11-gpt-image-2-card-art-contact-proof-2026-05-31.png`
- `reports/agent-town-hq10-hq11-gpt-image-2-asset-pack-2026-05-31.md`

## UI Wiring

`public/experiences/founders-plot/founders-plot.js` now defines two dedicated card-art asset refs:

- `CARD_ART.civicProposalDossier`
- `CARD_ART.generatedUniverseOverlayPack`

The HQ10B summary/status card uses `CARD_ART.civicProposalDossier`.

The HQ10C summary/status card uses `CARD_ART.generatedUniverseOverlayPack`.

The existing `CARD_ART.worldGridBeacon` reference remains in place for World Grid, local overlay preview, and Civic Operations surfaces.

## Proof

Contact/proof image:

- `reports/agent-town-hq10-hq11-gpt-image-2-card-art-contact-proof-2026-05-31.png`

ImageMagick identify:

```text
reports/agent-town-hq10-hq11-gpt-image-2-card-art-contact-proof-2026-05-31.png PNG 960x320 480x320+0+0 8-bit sRGB 606581B
```

## Checks Run

```text
identify public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.generated.png public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.png public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.webp public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.generated.png public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.png public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.webp reports/agent-town-hq10-hq11-gpt-image-2-card-art-contact-proof-2026-05-31.png
PASS
```

```text
node --check public/experiences/founders-plot/founders-plot.js
PASS
```

```text
node -e "for (const f of ['public/experiences/founders-plot/assets/objects/civic-proposal-dossier-card-art.json','public/experiences/founders-plot/assets/objects/generated-universe-overlay-pack-card-art.json']) JSON.parse(require('fs').readFileSync(f,'utf8')); console.log('metadata json ok')"
PASS - metadata json ok
```

```text
npx playwright test e2e/200_founders_plot.spec.js --grep "FP-E2E-017|FP-E2E-018"
PASS - 2/2
```

```text
git diff --check
PASS
```

## Notes

The worktree was already dirty with many unrelated Agent Town files. This lane only added the assets/report listed above and made a minimal `founders-plot.js` presentation reference change for the HQ10B/HQ10C status-card art.
