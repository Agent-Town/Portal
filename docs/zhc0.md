# ZHC0 — Founders Loop

Status: kickoff working doc  
Last updated: 2026-03-16
Branch: `zhc0-founders-loop`

## Related docs

- `docs/zhc0-implementation-checklist.md`
- `docs/zhc-future-vision.md`
- `docs/zhc-design-concept-borrowings.md`
- `docs/zhc-formal-spec-strategy.md`
- `docs/zhc-spec-stack.md`
- `docs/founders-loop-state-model.md`
- `docs/zhc-benchmark-games.md`
- `docs/zhc-precedents-and-divergence.md`
- `docs/zhc-subsystem-benchmark-map.md`
- `docs/zhc-remote-branch-audit.md`
- `docs/zhc0-screen-plan.md`
- `docs/zhc-current-status.md`

## 1. What this branch is

ZHC0 is the **first playable zero-human-company loop** for Agent Town.

It is not the full platform.
It is not the final org-sim.
It is the smallest version that should already feel like:

> a human and their agent start a company together, do one real mission, save what they learned, and get pointed to the next move.

## 2. Branch lineage

Current branch base:
- `origin/codex/frontend-design`

Important ancestry:
- `codex/frontend-design` is a descendant of `codex/option5-integration-tdd-runbooks-v0-1`
- before that, the main underlying integration line is `codex/option5-integration`

Practical meaning:
- use `frontend-design` as the substrate,
- selectively port ideas from other branches,
- do not merge all experimental UI branches blindly.

## 3. Product rule

ZHC0 should use **real platform actions** whenever possible.

That means:

1. no fake tutorial-only magic,
2. no fake company sim UI disconnected from the real system,
3. no admin-only shortcuts in the core player path,
4. no requirement for AI fluency.

## 4. Canonical first playable loop

1. **Enter town**
2. **Meet / hatch your agent**
3. **Name the founders**
4. **Prove alignment**
5. **Create the company crest**
6. **Open HQ**
7. **Run first mission**
8. **Save first memory**
9. **Unlock next quest**

## 5. What the public user should ideally need

The mainstream target should have:

1. a browser,
2. login/auth path,
3. OpenClaw Lite in browser,
4. a starter mind/provider path,
5. persistent hosted storage,
6. House identity,
7. one clear first mission.

They should ideally **not** need on day one:

1. local OpenClaw install,
2. terminal comfort,
3. server setup,
4. custom prompt engineering,
5. raw provider key management if a starter lane can be provided.

## 6. Current dogfooding rule

To feel the same pain as future users, the core ZHC0 loop should be playable with:

1. browser-first interaction,
2. OpenClaw Lite,
3. the same onboarding UI users get,
4. the same model/provider setup path users get,
5. no hidden CLI-only core steps,
6. no manual DB edits,
7. no secret operator backdoors in the core loop.

Power-user/self-host/export flows can come later.
They are not the first-play contract.

## 7. Current system mapping

| Story term | Current system |
| --- | --- |
| founders | Town Hall |
| first worker | Brain/Mind + Lite runtime |
| crest / seal | `/create` |
| HQ | House |
| company memory | Library |
| operating manuals | Workshop + Library |
| first missions | Web / Poker / experiences |
| progress board | Tracks |
| mailroom | Pony |
| market / public directory | Registry |
| audit / improvement | Archive + Trainer |

## 8. Hard scope limit for ZHC0

ZHC0 is believable today as:

1. one founder,
2. one agent,
3. one HQ,
4. one or two mission lanes,
5. one memory loop,
6. one progression loop.

ZHC0 is **not** yet:

1. a full multi-agent org simulator,
2. a many-company dashboard,
3. a finished economy layer,
4. a perfect China-ready platform bundle.

## 9. First mission recommendation

For earliest playability, start with **one mission lane**.

Best candidate:
- **Web Ops / market research mission**

Why:
- closest to real value,
- easiest to explain,
- already maps onto existing systems,
- can produce memory and track progress fast.

## 10. Region strategy

Near-term lanes:

1. international/default
2. China

Rule:
- one shared world and onboarding story,
- region-specific provider/integration packs underneath,
- avoid exposing a giant infrastructure matrix early.

## 11. Build principle

Do not build the whole company simulator first.

Build the same way users will build:

1. start,
2. hatch,
3. found,
4. try,
5. save,
6. improve.

If we have to cheat to make that feel good, the product is not ready yet.

## 12. Immediate next design/implementation goals

1. simplify `/start` into a stronger first-step entry
2. make Town Hall explicitly feel like founding the team
3. frame House as HQ, not just a dense system shell
4. expose only the first relevant mission lane
5. make saving first memory trivial
6. make the next quest obvious

## 13. Branch operating rule

Use this branch for:

1. product framing,
2. onboarding flow shaping,
3. ruthless UI simplification toward the founders loop,
4. selective porting/cherry-picking from other branches.

Do not use this branch to absorb every unfinished parallel frontend idea.

## 14. Memory rule

When we discover:

1. a good future mission,
2. a useful company metaphor,
3. a China/international product need,
4. a dogfooding pain point,
5. a scope warning,
6. a strong UX idea worth preserving,

write it down in a branch doc or daily memory immediately.

Do not trust chat history to remember it for us.
