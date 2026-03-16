--------------------------- MODULE DesignProjectionNoDrift ---------------------------
EXTENDS FiniteSets, Naturals, TLC

\* This model formalizes the cross-cutting design rule:
\* one canonical meaning, many projections, no semantic drift.

CONSTANTS Dummy

Rooms == {"Start", "Town", "HouseLibrary", "TownHall"}
Tasks == {"enterTown", "exploreTown", "reviewLibrary", "reviewTrust", "setupIdentity"}
Selections == {"none", "artifact", "publicStack"}
TrustStates == {"na", "unknown", "verified", "blocked"}
Intents == {"enter", "explore", "curate", "trust", "identity"}
PrimaryActions == {
  "enterTown",
  "openHouseLibrary",
  "checkStack",
  "keepWorking",
  "saveIdentity",
  "returnTown"
}

RoomFacts == {
  "room.start",
  "room.town",
  "room.houseLibrary",
  "room.townHall"
}

GoalFacts == {
  "goal.enter",
  "goal.explore",
  "goal.curate",
  "goal.trust",
  "goal.identity"
}

ActionFacts == {
  "action.enterTown",
  "action.openHouseLibrary",
  "action.checkStack",
  "action.keepWorking",
  "action.saveIdentity",
  "action.returnTown"
}

SelectionFacts == {
  "selection.none",
  "selection.artifact",
  "selection.publicStack"
}

TrustFacts == {
  "trust.na",
  "trust.unknown",
  "trust.verified",
  "trust.blocked"
}

ExperienceFacts == {
  "entryReady",
  "townMapReady",
  "libraryReady",
  "artifactSelected",
  "stackNeedsTrustCheck",
  "stackVerified",
  "stackBlocked",
  "identityNeedsProvider",
  "identityReady",
  "advancedDrawerOpen",
  "advancedDrawerClosed"
}

TechnicalFacts == {
  "technical.providerState",
  "technical.verificationReceipt",
  "technical.artifactId",
  "technical.relayRoute"
}

LLMOnlyFacts == {"technical.relayRoute"}

Facts ==
  RoomFacts \cup GoalFacts \cup ActionFacts \cup SelectionFacts \cup TrustFacts \cup ExperienceFacts \cup TechnicalFacts

VARIABLES room, task, selection, trust, advancedOpen, providerConfigured

vars == <<room, task, selection, trust, advancedOpen, providerConfigured>>

RoomFactOf(r) ==
  CASE r = "Start" -> "room.start"
    [] r = "Town" -> "room.town"
    [] r = "HouseLibrary" -> "room.houseLibrary"
    [] OTHER -> "room.townHall"

GoalFactOf(t) ==
  CASE t = "enterTown" -> "goal.enter"
    [] t = "exploreTown" -> "goal.explore"
    [] t = "reviewLibrary" -> "goal.curate"
    [] t = "reviewTrust" -> "goal.trust"
    [] OTHER -> "goal.identity"

ActionFactOf(a) ==
  CASE a = "enterTown" -> "action.enterTown"
    [] a = "openHouseLibrary" -> "action.openHouseLibrary"
    [] a = "checkStack" -> "action.checkStack"
    [] a = "saveIdentity" -> "action.saveIdentity"
    [] a = "returnTown" -> "action.returnTown"
    [] OTHER -> "action.keepWorking"

SelectionFactOf(s) ==
  CASE s = "none" -> "selection.none"
    [] s = "artifact" -> "selection.artifact"
    [] OTHER -> "selection.publicStack"

TrustFactOf(t) ==
  CASE t = "na" -> "trust.na"
    [] t = "unknown" -> "trust.unknown"
    [] t = "verified" -> "trust.verified"
    [] OTHER -> "trust.blocked"

IntentOf(t) ==
  CASE t = "enterTown" -> "enter"
    [] t = "exploreTown" -> "explore"
    [] t = "reviewLibrary" -> "curate"
    [] t = "reviewTrust" -> "trust"
    [] OTHER -> "identity"

PrimaryActionOf(t, tr, provider) ==
  CASE t = "enterTown" -> "enterTown"
    [] t = "exploreTown" -> "openHouseLibrary"
    [] t = "reviewTrust" /\ tr = "unknown" -> "checkStack"
    [] t = "setupIdentity" /\ ~provider -> "saveIdentity"
    [] t = "setupIdentity" /\ provider -> "returnTown"
    [] OTHER -> "keepWorking"

TaskSpecificFacts(t, s, tr, provider) ==
  CASE t = "enterTown" ->
       {"entryReady"}
    [] t = "exploreTown" ->
       {"townMapReady"}
    [] t = "reviewLibrary" /\ s = "artifact" ->
       {"libraryReady", "artifactSelected"}
    [] t = "reviewLibrary" ->
       {"libraryReady"}
    [] t = "reviewTrust" /\ tr = "unknown" ->
       {"libraryReady", "stackNeedsTrustCheck"}
    [] t = "reviewTrust" /\ tr = "verified" ->
       {"libraryReady", "stackVerified"}
    [] t = "reviewTrust" /\ tr = "blocked" ->
       {"libraryReady", "stackBlocked"}
    [] t = "setupIdentity" /\ provider ->
       {"identityReady"}
    [] OTHER ->
       {"identityNeedsProvider"}

TechnicalFactsOf(t, s) ==
  (IF t = "setupIdentity" THEN {"technical.providerState"} ELSE {})
    \cup (IF s \in {"artifact", "publicStack"} THEN {"technical.artifactId"} ELSE {})
    \cup (IF s = "publicStack" THEN {"technical.verificationReceipt", "technical.relayRoute"} ELSE {})

DrawerFacts(adv) ==
  IF adv THEN {"advancedDrawerOpen"} ELSE {"advancedDrawerClosed"}

CanonicalFacts ==
  {
    RoomFactOf(room),
    GoalFactOf(task),
    ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)),
    SelectionFactOf(selection),
    TrustFactOf(trust)
  }
    \cup TaskSpecificFacts(task, selection, trust, providerConfigured)
    \cup DrawerFacts(advancedOpen)
    \cup TechnicalFactsOf(task, selection)

HumanFacts ==
  CASE task = "enterTown" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "entryReady"}
    [] task = "exploreTown" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "townMapReady"}
    [] task = "reviewLibrary" /\ selection = "artifact" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "artifactSelected"}
    [] task = "reviewLibrary" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "libraryReady"}
    [] task = "reviewTrust" /\ trust = "unknown" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "stackNeedsTrustCheck"}
    [] task = "reviewTrust" /\ trust = "verified" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "stackVerified"}
    [] task = "reviewTrust" /\ trust = "blocked" ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "stackBlocked"}
    [] task = "setupIdentity" /\ providerConfigured ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "identityReady"}
    [] OTHER ->
       {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured)), "identityNeedsProvider"}

AdvancedFacts ==
  IF advancedOpen THEN CanonicalFacts \ LLMOnlyFacts ELSE HumanFacts

LLMFacts == CanonicalFacts

VoiceFacts ==
  {GoalFactOf(task), ActionFactOf(PrimaryActionOf(task, trust, providerConfigured))}

CanonicalProjection ==
  [
    room |-> room,
    intent |-> IntentOf(task),
    primaryAction |-> PrimaryActionOf(task, trust, providerConfigured),
    selection |-> selection,
    trust |-> trust,
    facts |-> CanonicalFacts
  ]

HumanProjection ==
  [
    room |-> room,
    intent |-> IntentOf(task),
    primaryAction |-> PrimaryActionOf(task, trust, providerConfigured),
    selection |-> selection,
    trust |-> trust,
    facts |-> HumanFacts
  ]

AdvancedProjection ==
  [
    room |-> room,
    intent |-> IntentOf(task),
    primaryAction |-> PrimaryActionOf(task, trust, providerConfigured),
    selection |-> selection,
    trust |-> trust,
    facts |-> AdvancedFacts
  ]

LLMProjection ==
  [
    room |-> room,
    intent |-> IntentOf(task),
    primaryAction |-> PrimaryActionOf(task, trust, providerConfigured),
    selection |-> selection,
    trust |-> trust,
    facts |-> LLMFacts
  ]

VoiceProjection ==
  [
    room |-> room,
    intent |-> IntentOf(task),
    primaryAction |-> PrimaryActionOf(task, trust, providerConfigured),
    selection |-> selection,
    trust |-> trust,
    facts |-> VoiceFacts
  ]

TypeOK ==
  /\ room \in Rooms
  /\ task \in Tasks
  /\ selection \in Selections
  /\ trust \in TrustStates
  /\ advancedOpen \in BOOLEAN
  /\ providerConfigured \in BOOLEAN
  /\ CanonicalFacts \subseteq Facts
  /\ HumanFacts \subseteq Facts
  /\ AdvancedFacts \subseteq Facts
  /\ LLMFacts \subseteq Facts
  /\ VoiceFacts \subseteq Facts
  /\ IntentOf(task) \in Intents
  /\ PrimaryActionOf(task, trust, providerConfigured) \in PrimaryActions

TaskFitsRoom ==
  /\ room = "Start" => /\ task = "enterTown" /\ selection = "none" /\ trust = "na"
  /\ room = "Town" => /\ task = "exploreTown" /\ selection = "none" /\ trust = "na"
  /\ room = "HouseLibrary" => task \in {"reviewLibrary", "reviewTrust"}
  /\ room = "TownHall" => /\ task = "setupIdentity" /\ selection = "none" /\ trust = "na"
  /\ task = "reviewLibrary" => /\ room = "HouseLibrary" /\ selection \in {"none", "artifact"} /\ trust = "na"
  /\ task = "reviewTrust" => /\ room = "HouseLibrary" /\ selection = "publicStack" /\ trust \in {"unknown", "verified", "blocked"}

SummaryNotInvented ==
  HumanProjection.facts \subseteq CanonicalProjection.facts

HumanSummaryBound ==
  Cardinality(HumanProjection.facts) < 4

HumanAvoidsTechnicalOnly ==
  HumanProjection.facts \cap TechnicalFacts = {}

AdvancedSuperset ==
  HumanProjection.facts \subseteq AdvancedProjection.facts

AdvancedOnlyShowsCanonical ==
  AdvancedProjection.facts \subseteq CanonicalProjection.facts

AdvancedHidesLLMOnly ==
  AdvancedProjection.facts \cap LLMOnlyFacts = {}

AdvancedOpenAddsDetail ==
  advancedOpen => HumanProjection.facts # AdvancedProjection.facts

LLMCompleteness ==
  LLMProjection = CanonicalProjection

VoiceMatchesHuman ==
  /\ VoiceProjection.room = HumanProjection.room
  /\ VoiceProjection.intent = HumanProjection.intent
  /\ VoiceProjection.primaryAction = HumanProjection.primaryAction
  /\ VoiceProjection.selection = HumanProjection.selection
  /\ VoiceProjection.trust = HumanProjection.trust
  /\ VoiceProjection.facts \subseteq HumanProjection.facts

NoDrift ==
  /\ HumanProjection.room = CanonicalProjection.room
  /\ AdvancedProjection.room = CanonicalProjection.room
  /\ LLMProjection.room = CanonicalProjection.room
  /\ VoiceProjection.room = CanonicalProjection.room
  /\ HumanProjection.intent = CanonicalProjection.intent
  /\ AdvancedProjection.intent = CanonicalProjection.intent
  /\ LLMProjection.intent = CanonicalProjection.intent
  /\ VoiceProjection.intent = CanonicalProjection.intent
  /\ HumanProjection.primaryAction = CanonicalProjection.primaryAction
  /\ AdvancedProjection.primaryAction = CanonicalProjection.primaryAction
  /\ LLMProjection.primaryAction = CanonicalProjection.primaryAction
  /\ VoiceProjection.primaryAction = CanonicalProjection.primaryAction
  /\ HumanProjection.selection = CanonicalProjection.selection
  /\ AdvancedProjection.selection = CanonicalProjection.selection
  /\ LLMProjection.selection = CanonicalProjection.selection
  /\ VoiceProjection.selection = CanonicalProjection.selection
  /\ HumanProjection.trust = CanonicalProjection.trust
  /\ AdvancedProjection.trust = CanonicalProjection.trust
  /\ LLMProjection.trust = CanonicalProjection.trust
  /\ VoiceProjection.trust = CanonicalProjection.trust

Init ==
  /\ room = "Start"
  /\ task = "enterTown"
  /\ selection = "none"
  /\ trust = "na"
  /\ advancedOpen = FALSE
  /\ providerConfigured = FALSE

EnterTown ==
  /\ room = "Start"
  /\ room' = "Town"
  /\ task' = "exploreTown"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ advancedOpen' = FALSE
  /\ providerConfigured' = providerConfigured

OpenHouseLibrary ==
  /\ room = "Town"
  /\ room' = "HouseLibrary"
  /\ task' = "reviewLibrary"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ advancedOpen' = FALSE
  /\ providerConfigured' = providerConfigured

SelectArtifact ==
  /\ room = "HouseLibrary"
  /\ task = "reviewLibrary"
  /\ selection # "artifact"
  /\ room' = room
  /\ task' = "reviewLibrary"
  /\ selection' = "artifact"
  /\ trust' = "na"
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = providerConfigured

SelectPublicStack ==
  /\ room = "HouseLibrary"
  /\ task \in {"reviewLibrary", "reviewTrust"}
  /\ room' = room
  /\ task' = "reviewTrust"
  /\ selection' = "publicStack"
  /\ trust' = "unknown"
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = providerConfigured

VerifyPublicStack ==
  /\ room = "HouseLibrary"
  /\ task = "reviewTrust"
  /\ selection = "publicStack"
  /\ trust = "unknown"
  /\ room' = room
  /\ task' = task
  /\ selection' = selection
  /\ trust' = "verified"
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = providerConfigured

BlockPublicStack ==
  /\ room = "HouseLibrary"
  /\ task = "reviewTrust"
  /\ selection = "publicStack"
  /\ trust = "unknown"
  /\ room' = room
  /\ task' = task
  /\ selection' = selection
  /\ trust' = "blocked"
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = providerConfigured

ClearLibrarySelection ==
  /\ room = "HouseLibrary"
  /\ selection # "none"
  /\ room' = room
  /\ task' = "reviewLibrary"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = providerConfigured

OpenTownHall ==
  /\ room = "Town"
  /\ room' = "TownHall"
  /\ task' = "setupIdentity"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ advancedOpen' = FALSE
  /\ providerConfigured' = providerConfigured

ConfigureProvider ==
  /\ room = "TownHall"
  /\ task = "setupIdentity"
  /\ ~providerConfigured
  /\ room' = room
  /\ task' = task
  /\ selection' = selection
  /\ trust' = trust
  /\ advancedOpen' = advancedOpen
  /\ providerConfigured' = TRUE

ReturnTown ==
  /\ room \in {"HouseLibrary", "TownHall"}
  /\ room' = "Town"
  /\ task' = "exploreTown"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ advancedOpen' = FALSE
  /\ providerConfigured' = providerConfigured

ToggleAdvanced ==
  /\ room \in {"HouseLibrary", "TownHall"}
  /\ room' = room
  /\ task' = task
  /\ selection' = selection
  /\ trust' = trust
  /\ advancedOpen' = ~advancedOpen
  /\ providerConfigured' = providerConfigured

Next ==
  \/ EnterTown
  \/ OpenHouseLibrary
  \/ SelectArtifact
  \/ SelectPublicStack
  \/ VerifyPublicStack
  \/ BlockPublicStack
  \/ ClearLibrarySelection
  \/ OpenTownHall
  \/ ConfigureProvider
  \/ ReturnTown
  \/ ToggleAdvanced

Spec ==
  Init /\ [][Next]_vars

=============================================================================
