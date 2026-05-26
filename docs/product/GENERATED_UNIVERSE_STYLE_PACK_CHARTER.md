# Generated Universe + Style Pack Charter

Status: prototype-gated roadmap track

## Purpose

Generated Universe + Style Packs let a player enter a prompt and receive a playable Agent Town wrapper: visual style, names, lore, factions, culture, generated text, asset references, and later approved bounded modifiers.

The pack never owns server truth.

## Boundary

Server truth remains canonical for plot state, region state, settlement ownership, resources, buildings, contracts, tools, Foreman authority, world events, permissions, and audit logs.

Generated packs may define display names, visual skins, UI trim, lore, species, factions, cultures, requester flavor, contract flavor, asset prompt plans, asset manifests, and runtime Three.js material maps.

Generated packs may not define arbitrary tools, formulas, server mutation handlers, resource keys, permission rules, account identity, Brain settings, provider settings, API credentials, or wallet data.

## Rollback

Every generated pack is addressed by a stable `packId` and prompt hash. If validation or playtest fails, the runtime falls back to the default Agent Town pack without mutating canonical game state. Production generated image assets require candidate folders, manifest provenance, and human signoff before promotion.

## AI-Measurable Definition Of Done

```json
{
  "canonicalServerTruthPreserved": true,
  "generatedPackMutationAuthority": false,
  "docDefinesAllowedGeneratedFields": true,
  "docDefinesForbiddenGeneratedFields": true,
  "docDefinesRollbackPath": true
}
```

