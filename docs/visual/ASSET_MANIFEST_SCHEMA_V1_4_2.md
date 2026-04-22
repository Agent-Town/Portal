# Asset Manifest Schema V1.4.2

Production generated assets must be traceable.

## Required manifest shape

```json
{
  "schemaVersion": "v1.4.2",
  "assets": [
    {
      "id": "founders_plot_hq_lv1_v1_4_2",
      "role": "founders_plot_building",
      "path": "public/experiences/founders-plot/assets/buildings/hq-lv1.webp",
      "status": "approved",
      "generatedBy": "gpt-image-2",
      "generationMode": "codex_builtin|api_batch",
      "model": "gpt-image-2",
      "promptFile": "specs/prompts/v1_4_2/founders_plot_hq_lv1_v1_4_2.md",
      "promptHash": "sha256:...",
      "referenceInputs": [
        "docs/brand/reference/platform/agenttown-visual-reference.jpeg"
      ],
      "referenceHashes": {
        "docs/brand/reference/platform/agenttown-visual-reference.jpeg": "sha256:..."
      },
      "candidateId": "cand_a",
      "candidatePath": "public/experiences/founders-plot/assets/candidates/v1_4_2/buildings/hq-lv1/cand_a.webp",
      "postProcessing": [
        "background-removal",
        "crop",
        "webp-compression"
      ],
      "dimensions": {
        "width": 512,
        "height": 512
      },
      "byteSize": 143000,
      "containsIntentionalText": false,
      "alt": "Headquarters cabin",
      "approvedBy": "named-human-art-owner",
      "approvedAt": "2026-04-22",
      "approvalNotes": "Readable at game scale and matches V1.4.2 style family.",
      "replaces": "public/experiences/founders-plot/assets/buildings/hq-lv1.webp",
      "rollbackPath": "public/experiences/founders-plot/assets/legacy/v1_3_1/buildings/hq-lv1.webp"
    }
  ]
}
```

## Allowed statuses

```text
candidate
needs_human_signoff
approved
rejected
legacy
reference_only
```

## Required production rule

Player-facing production routes may only reference generated assets with:

```text
status = approved
```

or, during a review branch only:

```text
status = needs_human_signoff
```

but the final merge candidate must have explicit signoff for all P0 production assets.
