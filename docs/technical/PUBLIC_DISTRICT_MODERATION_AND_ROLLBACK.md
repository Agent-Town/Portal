# Public District Moderation And Rollback

Status: prototype baseline implemented for V5.5; release review still required

## Moderation Boundary

Public districts and sandbox districts cannot accept arbitrary content, code,
uploads, or cross-town mutations. Every public action is typed and policy
checked before becoming visible.

## Rollback Boundary

Every accepted sandbox action records:

- actor public ID;
- action kind;
- typed payload;
- moderation decision;
- rollback snapshot ID;
- affected public cell IDs.

Rollback restores the public district state only. It cannot mutate private
settlement state.

## Prototype Baseline

- `server/world_grid/sandbox.js` stores typed sandbox actions, redacted
  participants, and rollback snapshots.
- Unsupported props and unsupported agent demos are recorded as `rejected`
  actions and do not change sandbox cells.
- Approved actions record rollback snapshots before public sandbox mutation.
- Focused tests verify rollback restoration and no private Founders Plot state
  creation during sandbox actions.
