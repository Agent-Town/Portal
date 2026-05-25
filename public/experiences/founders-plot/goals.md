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
- Choose the first Public Square town opportunity and let its tradeoff visibly change town signals.
- Upgrade Headquarters to level 2.
- Place the first Farm Plot before drifting into optimization.
- Choose one living contract from a named town requester.
- See Clover recommend one contract based on town state and any lightweight teaching preference.
- Let that request visibly change one town signal.
- Read a Morning Brief after meaningful events or return simulation.
- Teach Clover one tiny preference: do this again, ask me first, prefer reserves, or prefer speed.
- Keep Clover preferences reversible through the Clover rules card: prefer reserves, prefer speed, ask before spending, or finish active contracts first.
- If two preferences conflict, let the Exception Inbox ask for a decision instead of letting Clover guess.
- Start the first short civic scenario after the town has proven two requests.
- Prepare at least two Storm Prep tasks while deciding whether to spend reserves or keep pushing contracts.
- Let the scenario outcome appear in the Public Square, Three.js civic anchor, journal, and Morning Brief.
- Choose a Public Square style after the Welcome Sign is raised.
- Generate a public-safe plot card that shows town identity without private Brain or runtime details.
- Capture a public-safe Three.js postcard with a camera flyover route and no private Brain or runtime details.
- Keep an eye on soft civic moments such as `PREPARATION` requests before they slip by.
- Spend the first real coin sink on the Public Square Welcome Sign.
- Give Clover one Standing Order: Careful Steward or Bold Founder.
- Teach the foreman one safe automation at a time.
- Grant Clover a short Foreman lease before routine help continues.
- Use the Exception Inbox when Clover needs a decision instead of letting it guess.
- Let the real in-session Foreman collect one ready output through the worker-owned authenticated route.
- Start while-away Clover help after a real Brain, collect permission, and lease are active, then let it collect only ready output with a receipt and Morning Brief note.
- Confirm while-away Clover help still runs through the server sweep when the page is closed, then reopens with the Morning Brief receipt.
- Pause while-away Clover help and verify no further routine task runs while paused.
- Launch the Settler Expedition only after the first town has proven while-away governance.
- Use the Governor Ledger to focus Founders Plot or Ridge Outpost without losing either settlement's inventory or buildings.
- Complete Ridge Outpost's first founding task from outpost supplies, not Founders Plot supplies.
- Choose one operating charter after Ridge Outpost is active.
- Unlock one small Capability Web node and verify it changes available actions without granting broad autonomy.
- Let the chosen charter visibly weight contract recommendations, Clover advice, Morning Brief, and town signage.
- Staff Builder Foreman and Quartermaster only after the specialist gate is ready.
- Pause or reassign a specialist lane when the player changes staffing.
- Route conflicting specialist recommendations to the Exception Inbox before any action is chosen.
- Open the Ridge Supply Route after regional governance is ready.
- Move one bounded shipment from Founders Plot to Ridge Outpost without changing the total cross-town resource count.
- Accept and complete one regional contract that references both towns.
- Recover from a visible route shortage by producing the missing resource and retrying the route.
- Generate a public-safe operating-style card from the Operating Model drawer after charter, doctrine, specialist, and regional identity exist.
- Compare an imported operating style as inspiration without granting resources, buildings, permissions, or Capability Web nodes.
- Install the approved Creator Notice Kiosk after HQ2 and see it appear as a town object.
- Post, disable, and remove the Notice Kiosk without changing core town resources, buildings, permissions, or progress.
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

## First-Session Mode Ladder

1. Enter Founders Plot through Play Now.
2. Build manually in Manual Founder Mode.
3. Let Clover guide the basics.
4. When the first routine-help opportunity appears, offer Connect Brain.
5. After Brain connection, Real Clover may perform approved tool actions.
6. After HQ growth, invite the player to Town Hall to make the town identity official.
