------------------------- MODULE HouseLibraryTaskDisclosure -------------------------
EXTENDS FiniteSets, Naturals, TLC

\* This model formalizes the House Library task-first disclosure rule:
\* the human surface stays action-first and bounded,
\* advanced views reveal more detail without changing meaning,
\* the LLM retains the full canonical Library state.

CONSTANTS Dummy

Tasks == {
  "save",
  "openLocal",
  "reviewTrust",
  "receiveDelivery",
  "reviewHidden",
  "followRoute"
}

Sections == {
  "MemoryTable",
  "KeepBox",
  "TrustedFinds",
  "RouteDesk",
  "HiddenShelf",
  "Deliveries"
}

PrimarySections == {"MemoryTable", "KeepBox", "TrustedFinds"}
SecondarySections == {"RouteDesk", "HiddenShelf", "Deliveries"}

Selections == {
  "none",
  "localItem",
  "publicStack",
  "delivery",
  "hiddenStack",
  "routeStack"
}

TrustStates == {"na", "unknown", "verified", "blocked"}
DetailModes == {"closed", "itemDetail", "provenance", "advancedDesk"}

GoalFacts == {
  "goal.save",
  "goal.openLocal",
  "goal.reviewTrust",
  "goal.receiveDelivery",
  "goal.reviewHidden",
  "goal.followRoute"
}

SectionFacts == {
  "section.memoryTable",
  "section.keepBox",
  "section.trustedFinds",
  "section.routeDesk",
  "section.hiddenShelf",
  "section.deliveries"
}

ActionFacts == {
  "action.capture",
  "action.openItem",
  "action.useInChat",
  "action.checkStack",
  "action.importStack",
  "action.openDelivery",
  "action.importDelivery",
  "action.inspectHidden",
  "action.restoreOrHide",
  "action.syncRoute",
  "action.importRoute"
}

SelectionFacts == {
  "selection.none",
  "selection.localItem",
  "selection.publicStack",
  "selection.delivery",
  "selection.hiddenStack",
  "selection.routeStack"
}

TrustFacts == {
  "trust.na",
  "trust.unknown",
  "trust.verified",
  "trust.blocked"
}

StateFacts == {
  "state.captureReady",
  "state.localList",
  "state.localSelected",
  "state.stackNeedsCheck",
  "state.stackVerified",
  "state.stackBlocked",
  "state.deliveryList",
  "state.deliverySelected",
  "state.hiddenList",
  "state.hiddenSelected",
  "state.routeList",
  "state.routeSelected"
}

DetailFacts == {
  "detail.localItem",
  "detail.publicStack",
  "detail.delivery",
  "detail.hiddenStack",
  "detail.routeStack"
}

TechnicalFacts == {
  "technical.artifactId",
  "technical.revisionChain",
  "technical.provenanceReceipt",
  "technical.trustProof",
  "technical.relayReceipt",
  "technical.routeId",
  "technical.hiddenReason"
}

LLMOnlyFacts == {"technical.routeId", "technical.relayReceipt"}

Facts ==
  GoalFacts \cup SectionFacts \cup ActionFacts \cup SelectionFacts \cup TrustFacts \cup StateFacts \cup DetailFacts \cup TechnicalFacts

VARIABLES task, focusSection, selection, trust, detailMode

vars == <<task, focusSection, selection, trust, detailMode>>

GoalFactOf(t) ==
  CASE t = "save" -> "goal.save"
    [] t = "openLocal" -> "goal.openLocal"
    [] t = "reviewTrust" -> "goal.reviewTrust"
    [] t = "receiveDelivery" -> "goal.receiveDelivery"
    [] t = "reviewHidden" -> "goal.reviewHidden"
    [] OTHER -> "goal.followRoute"

SectionFactOf(s) ==
  CASE s = "MemoryTable" -> "section.memoryTable"
    [] s = "KeepBox" -> "section.keepBox"
    [] s = "TrustedFinds" -> "section.trustedFinds"
    [] s = "RouteDesk" -> "section.routeDesk"
    [] s = "HiddenShelf" -> "section.hiddenShelf"
    [] OTHER -> "section.deliveries"

SelectionFactOf(s) ==
  CASE s = "none" -> "selection.none"
    [] s = "localItem" -> "selection.localItem"
    [] s = "publicStack" -> "selection.publicStack"
    [] s = "delivery" -> "selection.delivery"
    [] s = "hiddenStack" -> "selection.hiddenStack"
    [] OTHER -> "selection.routeStack"

TrustFactOf(t) ==
  CASE t = "na" -> "trust.na"
    [] t = "unknown" -> "trust.unknown"
    [] t = "verified" -> "trust.verified"
    [] OTHER -> "trust.blocked"

PrimaryActionOf(t, s, tr) ==
  CASE t = "save" -> "action.capture"
    [] t = "openLocal" /\ s = "none" -> "action.openItem"
    [] t = "openLocal" -> "action.useInChat"
    [] t = "reviewTrust" /\ tr = "unknown" -> "action.checkStack"
    [] t = "reviewTrust" -> "action.importStack"
    [] t = "receiveDelivery" /\ s = "none" -> "action.openDelivery"
    [] t = "receiveDelivery" -> "action.importDelivery"
    [] t = "reviewHidden" /\ s = "none" -> "action.inspectHidden"
    [] t = "reviewHidden" -> "action.restoreOrHide"
    [] t = "followRoute" /\ s = "none" -> "action.syncRoute"
    [] OTHER -> "action.importRoute"

StateFactOf(t, s, tr) ==
  CASE t = "save" -> "state.captureReady"
    [] t = "openLocal" /\ s = "localItem" -> "state.localSelected"
    [] t = "openLocal" -> "state.localList"
    [] t = "reviewTrust" /\ tr = "unknown" -> "state.stackNeedsCheck"
    [] t = "reviewTrust" /\ tr = "verified" -> "state.stackVerified"
    [] t = "reviewTrust" -> "state.stackBlocked"
    [] t = "receiveDelivery" /\ s = "delivery" -> "state.deliverySelected"
    [] t = "receiveDelivery" -> "state.deliveryList"
    [] t = "reviewHidden" /\ s = "hiddenStack" -> "state.hiddenSelected"
    [] t = "reviewHidden" -> "state.hiddenList"
    [] t = "followRoute" /\ s = "routeStack" -> "state.routeSelected"
    [] OTHER -> "state.routeList"

DetailFactsOf(s) ==
  CASE s = "localItem" -> {"detail.localItem"}
    [] s = "publicStack" -> {"detail.publicStack"}
    [] s = "delivery" -> {"detail.delivery"}
    [] s = "hiddenStack" -> {"detail.hiddenStack"}
    [] s = "routeStack" -> {"detail.routeStack"}
    [] OTHER -> {}

TechnicalFactsOf(t, s) ==
  CASE t = "openLocal" /\ s = "localItem" ->
       {"technical.artifactId", "technical.revisionChain"}
    [] t = "reviewTrust" /\ s = "publicStack" ->
       {"technical.artifactId", "technical.provenanceReceipt", "technical.trustProof"}
    [] t = "receiveDelivery" /\ s = "delivery" ->
       {"technical.artifactId", "technical.provenanceReceipt", "technical.relayReceipt"}
    [] t = "reviewHidden" /\ s = "hiddenStack" ->
       {"technical.artifactId", "technical.hiddenReason"}
    [] t = "followRoute" /\ s = "routeStack" ->
       {"technical.artifactId", "technical.provenanceReceipt", "technical.routeId", "technical.relayReceipt"}
    [] OTHER -> {}

CanonicalFacts ==
  {
    GoalFactOf(task),
    SectionFactOf(focusSection),
    PrimaryActionOf(task, selection, trust),
    SelectionFactOf(selection),
    TrustFactOf(trust),
    StateFactOf(task, selection, trust)
  }
    \cup DetailFactsOf(selection)
    \cup TechnicalFactsOf(task, selection)

HumanFacts ==
  {
    GoalFactOf(task),
    SectionFactOf(focusSection),
    PrimaryActionOf(task, selection, trust),
    StateFactOf(task, selection, trust)
  }

AdvancedFacts ==
  CASE detailMode = "closed" -> HumanFacts
    [] detailMode = "itemDetail" -> HumanFacts \cup DetailFactsOf(selection)
    [] detailMode = "provenance" ->
         HumanFacts \cup DetailFactsOf(selection)
                    \cup (TechnicalFactsOf(task, selection) \cap {"technical.provenanceReceipt", "technical.trustProof", "technical.hiddenReason"})
    [] OTHER ->
         CanonicalFacts \ LLMOnlyFacts

LLMFacts == CanonicalFacts

HumanProjection ==
  [
    task |-> task,
    focusSection |-> focusSection,
    primaryAction |-> PrimaryActionOf(task, selection, trust),
    selection |-> selection,
    trust |-> trust,
    facts |-> HumanFacts
  ]

AdvancedProjection ==
  [
    task |-> task,
    focusSection |-> focusSection,
    primaryAction |-> PrimaryActionOf(task, selection, trust),
    selection |-> selection,
    trust |-> trust,
    facts |-> AdvancedFacts
  ]

LLMProjection ==
  [
    task |-> task,
    focusSection |-> focusSection,
    primaryAction |-> PrimaryActionOf(task, selection, trust),
    selection |-> selection,
    trust |-> trust,
    facts |-> LLMFacts
  ]

TypeOK ==
  /\ task \in Tasks
  /\ focusSection \in Sections
  /\ selection \in Selections
  /\ trust \in TrustStates
  /\ detailMode \in DetailModes
  /\ HumanFacts \subseteq Facts
  /\ AdvancedFacts \subseteq Facts
  /\ LLMFacts \subseteq Facts

TaskFocusFits ==
  /\ task = "save" => focusSection = "KeepBox"
  /\ task = "openLocal" => focusSection = "MemoryTable"
  /\ task = "reviewTrust" => focusSection = "TrustedFinds"
  /\ task = "receiveDelivery" => focusSection = "Deliveries"
  /\ task = "reviewHidden" => focusSection = "HiddenShelf"
  /\ task = "followRoute" => focusSection = "RouteDesk"

TaskSelectionTrustFits ==
  /\ task = "save" => /\ selection = "none" /\ trust = "na"
  /\ task = "openLocal" => /\ selection \in {"none", "localItem"} /\ trust = "na"
  /\ task = "reviewTrust" => /\ selection = "publicStack" /\ trust \in {"unknown", "verified", "blocked"}
  /\ task = "receiveDelivery" => /\ selection \in {"none", "delivery"} /\ trust = "na"
  /\ task = "reviewHidden" => /\ selection \in {"none", "hiddenStack"} /\ trust = "blocked"
  /\ task = "followRoute" => /\ selection \in {"none", "routeStack"} /\ trust \in {"unknown", "verified"}

DisclosureFitsSelection ==
  /\ detailMode \in {"closed", "advancedDesk"} \/ selection # "none"
  /\ detailMode = "provenance" => task \in {"reviewTrust", "receiveDelivery", "reviewHidden", "followRoute"}

SummaryNotInvented ==
  HumanProjection.facts \subseteq LLMProjection.facts

HumanSummaryBound ==
  Cardinality(HumanProjection.facts) < 5

HumanShowsSingleGoal ==
  Cardinality(HumanProjection.facts \cap GoalFacts) = 1

HumanShowsSingleFocusSection ==
  Cardinality(HumanProjection.facts \cap SectionFacts) = 1

HumanShowsSinglePrimaryAction ==
  Cardinality(HumanProjection.facts \cap ActionFacts) = 1

HumanAvoidsTechnicalFacts ==
  HumanProjection.facts \cap TechnicalFacts = {}

HumanAvoidsDetailFacts ==
  HumanProjection.facts \cap DetailFacts = {}

AdvancedSuperset ==
  HumanProjection.facts \subseteq AdvancedProjection.facts

AdvancedOnlyShowsCanonical ==
  AdvancedProjection.facts \subseteq LLMProjection.facts

AdvancedHidesLLMOnly ==
  AdvancedProjection.facts \cap LLMOnlyFacts = {}

ClosedDisclosureMatchesHuman ==
  detailMode = "closed" => AdvancedProjection.facts = HumanProjection.facts

OpenDisclosureAddsFacts ==
  detailMode # "closed" => HumanProjection.facts # AdvancedProjection.facts

LLMCompleteness ==
  LLMProjection.facts = CanonicalFacts

NoDrift ==
  /\ HumanProjection.task = LLMProjection.task
  /\ AdvancedProjection.task = LLMProjection.task
  /\ HumanProjection.focusSection = LLMProjection.focusSection
  /\ AdvancedProjection.focusSection = LLMProjection.focusSection
  /\ HumanProjection.primaryAction = LLMProjection.primaryAction
  /\ AdvancedProjection.primaryAction = LLMProjection.primaryAction
  /\ HumanProjection.selection = LLMProjection.selection
  /\ AdvancedProjection.selection = LLMProjection.selection
  /\ HumanProjection.trust = LLMProjection.trust
  /\ AdvancedProjection.trust = LLMProjection.trust

Init ==
  /\ task = "openLocal"
  /\ focusSection = "MemoryTable"
  /\ selection = "none"
  /\ trust = "na"
  /\ detailMode = "closed"

GoSave ==
  /\ task # "save"
  /\ task' = "save"
  /\ focusSection' = "KeepBox"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ detailMode' = "closed"

GoOpenLocal ==
  /\ task # "openLocal"
  /\ task' = "openLocal"
  /\ focusSection' = "MemoryTable"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ detailMode' = "closed"

GoReviewTrust ==
  /\ task # "reviewTrust"
  /\ task' = "reviewTrust"
  /\ focusSection' = "TrustedFinds"
  /\ selection' = "publicStack"
  /\ trust' = "unknown"
  /\ detailMode' = "closed"

GoReceiveDelivery ==
  /\ task # "receiveDelivery"
  /\ task' = "receiveDelivery"
  /\ focusSection' = "Deliveries"
  /\ selection' = "none"
  /\ trust' = "na"
  /\ detailMode' = "closed"

GoReviewHidden ==
  /\ task # "reviewHidden"
  /\ task' = "reviewHidden"
  /\ focusSection' = "HiddenShelf"
  /\ selection' = "none"
  /\ trust' = "blocked"
  /\ detailMode' = "closed"

GoFollowRoute ==
  /\ task # "followRoute"
  /\ task' = "followRoute"
  /\ focusSection' = "RouteDesk"
  /\ selection' = "none"
  /\ trust' = "unknown"
  /\ detailMode' = "closed"

SelectLocalItem ==
  /\ task = "openLocal"
  /\ selection = "none"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = "localItem"
  /\ trust' = trust
  /\ detailMode' = "closed"

SelectDelivery ==
  /\ task = "receiveDelivery"
  /\ selection = "none"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = "delivery"
  /\ trust' = trust
  /\ detailMode' = "closed"

SelectHidden ==
  /\ task = "reviewHidden"
  /\ selection = "none"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = "hiddenStack"
  /\ trust' = trust
  /\ detailMode' = "closed"

SelectRoute ==
  /\ task = "followRoute"
  /\ selection = "none"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = "routeStack"
  /\ trust' = trust
  /\ detailMode' = "closed"

VerifyStack ==
  /\ task = "reviewTrust"
  /\ selection = "publicStack"
  /\ trust = "unknown"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = "verified"
  /\ detailMode' = detailMode

BlockStack ==
  /\ task = "reviewTrust"
  /\ selection = "publicStack"
  /\ trust = "unknown"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = "blocked"
  /\ detailMode' = detailMode

ClearSelection ==
  /\ selection # "none"
  /\ task # "reviewTrust"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = "none"
  /\ trust' =
      CASE task = "reviewHidden" -> "blocked"
        [] task = "followRoute" -> "unknown"
        [] OTHER -> "na"
  /\ detailMode' = "closed"

OpenItemDetail ==
  /\ selection # "none"
  /\ detailMode = "closed"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = trust
  /\ detailMode' = "itemDetail"

OpenProvenance ==
  /\ selection # "none"
  /\ task \in {"reviewTrust", "receiveDelivery", "reviewHidden", "followRoute"}
  /\ detailMode # "provenance"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = trust
  /\ detailMode' = "provenance"

OpenAdvancedDesk ==
  /\ detailMode # "advancedDesk"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = trust
  /\ detailMode' = "advancedDesk"

CloseDisclosure ==
  /\ detailMode # "closed"
  /\ task' = task
  /\ focusSection' = focusSection
  /\ selection' = selection
  /\ trust' = trust
  /\ detailMode' = "closed"

Next ==
  \/ GoSave
  \/ GoOpenLocal
  \/ GoReviewTrust
  \/ GoReceiveDelivery
  \/ GoReviewHidden
  \/ GoFollowRoute
  \/ SelectLocalItem
  \/ SelectDelivery
  \/ SelectHidden
  \/ SelectRoute
  \/ VerifyStack
  \/ BlockStack
  \/ ClearSelection
  \/ OpenItemDetail
  \/ OpenProvenance
  \/ OpenAdvancedDesk
  \/ CloseDisclosure

Spec ==
  Init /\ [][Next]_vars

=============================================================================
