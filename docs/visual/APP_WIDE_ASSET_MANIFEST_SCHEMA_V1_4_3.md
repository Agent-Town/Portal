# Agent Town V1.4.3 — App-Wide Asset Manifest Schema

The implementation must create/update:

```text
public/assets/platform/asset-manifest.json
```

## Top-level schema

```json
{
  "schemaVersion": "v1.4.3",
  "styleFamily": "agent-town-frontier-storybook-v1_4_3",
  "modelFamily": "gpt-image-2",
  "generatedAt": "ISO-8601",
  "approvalStatus": "pending | approved | approved_with_caveats | rejected",
  "approvedBy": "string | null",
  "approvedAt": "YYYY-MM-DD | null",
  "totalBytes": 0,
  "budgetBytes": 8388608,
  "assets": []
}
```

## Asset schema

```json
{
  "id": "string",
  "path": "string",
  "surface": "start_gate | town_shell | townhall | brain | house | pony | saloon | sigil | atlas | leaderboard | share | claim | generic | brand",
  "role": "hero_background | illustration | icon | empty_state | decoration | logo | favicon | card_art | modal_header | badge",
  "model": "gpt-image-2 | manual | existing | vector",
  "promptFile": "string | null",
  "promptHash": "sha256:string | null",
  "referenceInputs": ["string"],
  "referenceHashes": {
    "path": "sha256:string"
  },
  "candidatePaths": ["string"],
  "postProcessing": ["background_removal | crop | mask | webp_compression | svg_trace | color_adjustment | manual_paintover"],
  "width": 0,
  "height": 0,
  "bytes": 0,
  "format": "webp | png | svg | ico | jpg",
  "usedBy": ["string"],
  "approvalStatus": "pending | approved | approved_with_caveats | rejected",
  "approvedBy": "string | null",
  "approvedAt": "YYYY-MM-DD | null",
  "approvalNotes": "string",
  "replaces": ["string"],
  "rollbackPath": "string | null",
  "futureUse": false
}
```

## Validation rules

- If `model` is `gpt-image-2`, `promptFile` and `promptHash` are required.
- `promptMirrorFile` should be included when the prompt is mirrored into `public/assets/platform/prompts/v1_4_3/`.
- If `approvalStatus` is `approved`, `approvedBy` and `approvedAt` are required.
- If asset replaces an existing path, `rollbackPath` or documented git rollback note is required.
- If asset is not referenced by route code, `futureUse` must be true with notes.
