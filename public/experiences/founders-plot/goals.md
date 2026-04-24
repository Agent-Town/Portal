# Founders Plot Goals

## First-session goal ladder

### Goal 1 - Start the settlement manually

The player enters Founders Plot after login.

Clover says, in Manual Founder Mode:

> This is your first plot. I'll guide the basics while you build by hand.

Expected player actions:

1. inspect the first objective;
2. select the relevant lot/building;
3. perform the first build or production action;
4. collect first output.

### Goal 2 - Show why Clover needs a Brain

After the player sees a ready output, bottleneck, or contract need:

Clover may say:

> I can help watch for routine town work. Connect a Brain when you want me to reason and act as your Foreman.

The player can dismiss and continue manually.

### Goal 3 - Unlock Real Clover

If the player connects a Brain:

Clover says:

> Brain connected. I can now reason about your town and help with approved actions.

Clover may then use the Real Foreman path.

### Goal 4 - Make the town official later

After HQ2 or first contract:

Clover may say:

> Your settlement is growing. Visit Town Hall when you want to make it official.

Town Hall is optional for the first loop.

- Place the first Lumber Camp.
- Collect the first wood.
- Claim the one-time First Timber reward without duplicating it.
- Upgrade Headquarters to level 2.
- Place the first Farm Plot before drifting into optimization.
- Choose one living contract from a named town requester.
- Let that request visibly change one town signal.
- Keep an eye on soft civic moments such as `PREPARATION` requests before they slip by.
- Spend the first real coin sink on the Public Square Welcome Sign.
- Give Clover one Standing Order: Careful Steward or Bold Founder.
- Teach the foreman one safe automation at a time.
- Let the real in-session Foreman collect one ready output through the worker-owned authenticated route.
- Reach Headquarters level 5 without breaking determinism or trust.

---

## V1.4 Foreman AI Reality Update

### Example plan: collect ready output for active contract

Situation:

- a production building has completed buffered output;
- the active contract needs that resource;
- collect permission is enabled;
- safe candidate exists.

Clover should:

1. select the collect candidate;
2. explain briefly: “I collected lumber because the Contract Board needs wood.”;
3. let the server execute the canonical tool;
4. record receipt/replay metadata.

### Example plan: ask instead of spending

Situation:

- best action requires spending coin or resources beyond current policy;
- approval candidate exists.

Clover should:

1. select approval/request candidate;
2. explain the tradeoff;
3. wait for human decision;
4. not mutate the world until approved.

### Example plan: no-op honestly

Situation:

- no useful safe candidate exists;
- context is incomplete;
- player paused Clover.

Clover should:

1. return `HEARTBEAT_OK` or the relevant no-op code;
2. avoid idle chatter;
3. keep the UI calm.
