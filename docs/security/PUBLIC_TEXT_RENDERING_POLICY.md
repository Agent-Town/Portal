# Public Text Rendering Policy

Status: release-safety rule

Any player-authored, public, generated, or agent-authored text rendered in DOM
must use `textContent`, DOM construction, or explicit escaping before insertion.

This applies to:

- public presence names and town cards;
- world-grid sandbox labels, actions, and rollback summaries;
- civic service advice and report text;
- public works/event titles, recaps, and reward copy;
- future V6 civic proposals, vote summaries, charters, moderation reasons, and
  audit summaries;
- any Generated Universe or creator-pack text that can reach public surfaces.

## Forbidden Pattern

Do not pass untrusted text into `innerHTML`, template strings, or attribute
strings unless the value is escaped for the exact context first.

## Required Coverage

- Malicious public-name tests must prove no script, SVG, image handler, or HTML
  node execution.
- Future public civic surfaces must include DOM/XSS tests before they can become
  player-visible.
- Security review must treat agent-authored text as untrusted public text.
