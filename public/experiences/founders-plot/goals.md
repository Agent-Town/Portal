# Founders Plot Goals

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
