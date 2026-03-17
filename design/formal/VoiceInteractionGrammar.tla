------------------------- MODULE VoiceInteractionGrammar -------------------------
EXTENDS FiniteSets, Naturals, TLC

\* Voice interaction grammar contract:
\* 1) one canonical meaning per task state
\* 2) one human summary action surface
\* 3) one LLM action surface
\* 4) one future voice action surface
\* 5) no drift across surfaces
\* 6) locale-ready, stable command intent

CONSTANTS Dummy

Rooms == {"Start", "Town", "House", "TownHall", "HouseLibrary", "Workshop"}

Tasks == {
  "enterTown",
  "openLibrary",
  "openTownHall",
  "openWorkshop",
  "setupIdentity",
  "saveArtifact",
  "openArtifact",
  "reviewTrust",
  "receiveDelivery",
  "hideArtifact",
  "followRoute"
}

Sections == {
  "Entry",
  "Library",
  "TownHall",
  "Workshop",
  "KeepBox",
  "MemoryTable",
  "TrustedFinds",
  "Deliveries",
  "HiddenShelf",
  "RouteDesk"
}

Selections == {
  "none",
  "artifact",
  "publicStack",
  "delivery",
  "hiddenStack",
  "routeStack"
}

TrustStates == {"na", "unknown", "verified", "blocked"}

DetailModes == {"closed", "itemDetail", "provenance", "advanced"}

Locales == {"en", "zh"}

Verbs == {
  "go",
  "open",
  "continue",
  "save",
  "check",
  "hide",
  "follow",
  "bring",
  "share"
}

TaskRoom ==
  [
    "enterTown" |-> "Start",
    "openLibrary" |-> "Town",
    "openTownHall" |-> "Town",
    "openWorkshop" |-> "Town",
    "setupIdentity" |-> "TownHall",
    "saveArtifact" |-> "HouseLibrary",
    "openArtifact" |-> "HouseLibrary",
    "reviewTrust" |-> "HouseLibrary",
    "receiveDelivery" |-> "HouseLibrary",
    "hideArtifact" |-> "HouseLibrary",
    "followRoute" |-> "HouseLibrary"
  ]

TaskSection ==
  [
    "enterTown" |-> "Entry",
    "openLibrary" |-> "Library",
    "openTownHall" |-> "TownHall",
    "openWorkshop" |-> "Workshop",
    "setupIdentity" |-> "TownHall",
    "saveArtifact" |-> "KeepBox",
    "openArtifact" |-> "MemoryTable",
    "reviewTrust" |-> "TrustedFinds",
    "receiveDelivery" |-> "Deliveries",
    "hideArtifact" |-> "HiddenShelf",
    "followRoute" |-> "RouteDesk"
  ]

TaskSelectionSet ==
  [
    "enterTown" |-> {"none"},
    "openLibrary" |-> {"none"},
    "openTownHall" |-> {"none"},
    "openWorkshop" |-> {"none"},
    "setupIdentity" |-> {"none"},
    "saveArtifact" |-> {"none"},
    "openArtifact" |-> {"none", "artifact"},
    "reviewTrust" |-> {"none", "publicStack"},
    "receiveDelivery" |-> {"none", "delivery"},
    "hideArtifact" |-> {"none", "hiddenStack"},
    "followRoute" |-> {"none", "routeStack"}
  ]

TaskTrustSet ==
  [
    "enterTown" |-> {"na"},
    "openLibrary" |-> {"na"},
    "openTownHall" |-> {"na"},
    "openWorkshop" |-> {"na"},
    "setupIdentity" |-> {"na"},
    "saveArtifact" |-> {"na"},
    "openArtifact" |-> {"na"},
    "reviewTrust" |-> {"unknown", "verified", "blocked"},
    "receiveDelivery" |-> {"na"},
    "hideArtifact" |-> {"blocked"},
    "followRoute" |-> {"unknown", "verified"}
  ]

TaskDetailModeSet ==
  [
    "enterTown" |-> {"closed"},
    "openLibrary" |-> {"closed"},
    "openTownHall" |-> {"closed"},
    "openWorkshop" |-> {"closed"},
    "setupIdentity" |-> {"closed", "advanced"},
    "saveArtifact" |-> {"closed", "itemDetail"},
    "openArtifact" |-> {"closed", "itemDetail", "provenance"},
    "reviewTrust" |-> {"closed", "itemDetail", "provenance"},
    "receiveDelivery" |-> {"closed", "itemDetail", "provenance"},
    "hideArtifact" |-> {"closed", "itemDetail"},
    "followRoute" |-> {"closed", "itemDetail", "provenance"}
  ]

CommandForTask ==
  [
    "enterTown" |-> "cmd.enterTown",
    "openLibrary" |-> "cmd.openLibrary",
    "openTownHall" |-> "cmd.openTownHall",
    "openWorkshop" |-> "cmd.openWorkshop",
    "setupIdentity" |-> "cmd.setupIdentity",
    "saveArtifact" |-> "cmd.saveArtifact",
    "openArtifact" |-> "cmd.openArtifact",
    "reviewTrust" |-> "cmd.reviewTrust",
    "receiveDelivery" |-> "cmd.receiveDelivery",
    "hideArtifact" |-> "cmd.hideArtifact",
    "followRoute" |-> "cmd.followRoute"
  ]

VoiceAlias ==
  [
    "en" |-> [
      "cmd.enterTown" |-> "go_to_town",
      "cmd.openLibrary" |-> "open_library",
      "cmd.openTownHall" |-> "open_town_hall",
      "cmd.openWorkshop" |-> "open_workshop",
      "cmd.setupIdentity" |-> "continue",
      "cmd.saveArtifact" |-> "save_to_memory",
      "cmd.openArtifact" |-> "open_item",
      "cmd.reviewTrust" |-> "check_source",
      "cmd.receiveDelivery" |-> "open_delivery",
      "cmd.hideArtifact" |-> "hide_item",
      "cmd.followRoute" |-> "follow_route"
    ],
    "zh" |-> [
      "cmd.enterTown" |-> "go_to_town_zh",
      "cmd.openLibrary" |-> "open_library_zh",
      "cmd.openTownHall" |-> "open_town_hall_zh",
      "cmd.openWorkshop" |-> "open_workshop_zh",
      "cmd.setupIdentity" |-> "continue_zh",
      "cmd.saveArtifact" |-> "save_to_memory_zh",
      "cmd.openArtifact" |-> "open_item_zh",
      "cmd.reviewTrust" |-> "check_source_zh",
      "cmd.receiveDelivery" |-> "open_delivery_zh",
      "cmd.hideArtifact" |-> "hide_item_zh",
      "cmd.followRoute" |-> "follow_route_zh"
    ]
  ]

PrimaryVerbOf(task, selection) ==
  CASE task = "enterTown" -> "go"
    [] task = "openLibrary" -> "open"
    [] task = "openTownHall" -> "open"
    [] task = "openWorkshop" -> "open"
    [] task = "setupIdentity" -> "continue"
    [] task = "saveArtifact" -> "save"
    [] task = "openArtifact" /\ selection = "none" -> "open"
    [] task = "openArtifact" -> "bring"
    [] task = "reviewTrust" -> "check"
    [] task = "receiveDelivery" /\ selection = "none" -> "open"
    [] task = "receiveDelivery" -> "share"
    [] task = "hideArtifact" /\ selection = "none" -> "open"
    [] task = "hideArtifact" -> "hide"
    [] task = "followRoute" -> "follow"
    [] OTHER -> "open"

PrimaryActionFact(task, selection) == "action." \o PrimaryVerbOf(task, selection)

HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale) ==
  {
    "room." \o TaskRoom[task],
    "task." \o task,
    "section." \o focusSection,
    "selection." \o selection,
    "trust." \o trust,
    "detail." \o detailMode,
    "locale." \o locale,
    "goal." \o task,
    PrimaryActionFact(task, selection),
    "verb." \o PrimaryVerbOf(task, selection)
  }

DetailFacts(task, selection) ==
  CASE selection = "artifact" -> {"detail.memory"}
    [] selection = "publicStack" -> {"detail.provenance"}
    [] selection = "delivery" -> {"detail.delivery"}
    [] selection = "hiddenStack" -> {"detail.hidden"}
    [] selection = "routeStack" -> {"detail.route"}
    [] OTHER -> {}

TechnicalFactsForTask(task, selection) ==
  CASE task = "openArtifact" /\ selection = "artifact" ->
       {"technical.artifactId", "technical.revisionChain"}
    [] task = "reviewTrust" /\ selection = "publicStack" ->
       {"technical.artifactId", "technical.provenanceReceipt", "technical.trustProof"}
    [] task = "receiveDelivery" /\ selection = "delivery" ->
       {"technical.artifactId", "technical.provenanceReceipt", "technical.relayReceipt"}
    [] task = "followRoute" /\ selection = "routeStack" ->
       {"technical.artifactId", "technical.routeId"}
    [] OTHER -> {}

StateFacts(task, selection) ==
  CASE task = "enterTown" -> {"state.EnteredTown"}
    [] task = "openLibrary" -> {"state.LibraryActive"}
    [] task = "openTownHall" -> {"state.TownHallActive"}
    [] task = "openWorkshop" -> {"state.WorkshopActive"}
    [] task = "setupIdentity" -> {"state.TownHallActive"}
    [] task = "saveArtifact" -> {"state.keepingArtifact"}
    [] task = "openArtifact" -> {"state.usingArtifact"}
    [] task = "reviewTrust" -> {"state.reviewingTrust"}
    [] task = "receiveDelivery" -> {"state.reviewingDelivery"}
    [] task = "hideArtifact" -> {"state.reviewingHidden"}
    [] task = "followRoute" -> {"state.followingRoute"}
    [] OTHER -> {}

CanonicalFacts(task, focusSection, selection, trust, detailMode, locale) ==
  {
    "command." \o CommandForTask[task],
    "voice.command." \o CommandForTask[task],
    "voice.phrase." \o VoiceAlias[locale][CommandForTask[task]]
  }
    \cup HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
    \cup DetailFacts(task, selection)
    \cup StateFacts(task, selection)
    \cup TechnicalFactsForTask(task, selection)

AdvancedFacts(task, focusSection, selection, trust, detailMode, locale) ==
  CASE detailMode = "closed" -> HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
    [] detailMode = "itemDetail" ->
       HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
       \cup DetailFacts(task, selection)
       \cup (TechnicalFactsForTask(task, selection) \ { "technical.provenanceReceipt", "technical.trustProof", "technical.relayReceipt" })
    [] detailMode = "provenance" ->
       HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
       \cup DetailFacts(task, selection)
       \cup (TechnicalFactsForTask(task, selection) \ {"technical.revisionChain"})
    [] OTHER ->
       HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
       \cup DetailFacts(task, selection)
       \cup TechnicalFactsForTask(task, selection)

LLMFacts(task, focusSection, selection, trust, detailMode, locale) ==
  CanonicalFacts(task, focusSection, selection, trust, detailMode, locale)
    \cup TechnicalFactsForTask(task, selection)

HumanProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom[task],
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    facts |-> HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale)
  ]

AdvancedProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom[task],
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask[task],
    facts |-> AdvancedFacts(task, focusSection, selection, trust, detailMode, locale)
  ]

LLMProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom[task],
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask[task],
    facts |-> LLMFacts(task, focusSection, selection, trust, detailMode, locale)
  ]

VoiceProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom[task],
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask[task],
    phrase |-> VoiceAlias[locale][CommandForTask[task]],
    facts |-> {
      "locale." \o locale,
      "voice.command." \o CommandForTask[task],
      "voice.phrase." \o VoiceAlias[locale][CommandForTask[task]]
    }
  ]

VARIABLES task, focusSection, selection, trust, detailMode, voiceLocale

vars == <<task, focusSection, selection, trust, detailMode, voiceLocale>>

TypeOK ==
  /\ task ∈ Tasks
  /\ focusSection ∈ Sections
  /\ selection ∈ Selections
  /\ trust ∈ TrustStates
  /\ detailMode ∈ DetailModes
  /\ voiceLocale ∈ Locales
  /\ focusSection = TaskSection[task]

TaskSelectionTrustFits ==
  /\ selection ∈ TaskSelectionSet[task]
  /\ trust ∈ TaskTrustSet[task]
  /\ detailMode ∈ TaskDetailModeSet[task]

TaskRoomKnown ==
  TaskRoom[task] ∈ Rooms

CanonicalVerbValid ==
  PrimaryVerbOf(task, selection) ∈ Verbs

HumanSimple ==
  Cardinality(HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts ∩ {
    "action.go",
    "action.open",
    "action.continue",
    "action.save",
    "action.check",
    "action.hide",
    "action.follow",
    "action.bring",
    "action.share"
  }) = 1

CanonicalCoversHuman ==
  HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    ⊆ CanonicalFacts(task, focusSection, selection, trust, detailMode, voiceLocale)

LLMCompleteness ==
  HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    ⊆ LLMProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

AdvancedSuperset ==
  HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    ⊆ AdvancedProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

NoTechnicalLeakInHuman ==
  HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    ∩ {"technical.artifactId", "technical.revisionChain", "technical.provenanceReceipt", "technical.trustProof", "technical.routeId", "technical.relayReceipt"} = {}

NoDrift ==
  /\ HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).primaryAction
      = LLMProjection(task, focusSection, selection, trust, detailMode, voiceLocale).primaryAction
  /\ HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).primaryAction
      = VoiceProjection(task, focusSection, selection, trust, detailMode, voiceLocale).primaryAction
  /\ LLMProjection(task, focusSection, selection, trust, detailMode, voiceLocale).command
      = VoiceProjection(task, focusSection, selection, trust, detailMode, voiceLocale).command

ClosedDisclosureMatchesHuman ==
  detailMode = "closed" =>
    AdvancedProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
      = HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

OpenDisclosureAddsFacts ==
  detailMode # "closed" =>
    HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
      \subseteq AdvancedProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

VoiceAliasExists ==
  ∀ t \in Tasks, l \in Locales:
    VoiceAlias[l][CommandForTask[t]] # ""

NoLocaleAliasCollision ==
  ∀ l \in Locales:
    ∀ t1, t2 \in Tasks:
      t1 # t2 =>
        VoiceAlias[l][CommandForTask[t1]] # VoiceAlias[l][CommandForTask[t2]]

LocaleSwitchOnlyCommandStable ==
  ∀ l1, l2 \in Locales:
    CommandForTask[task] =
      VoiceProjection(task, focusSection, selection, trust, detailMode, l1).command
      \* command must be locale-invariant for current task
      /\ VoiceProjection(task, focusSection, selection, trust, detailMode, l1).command
         = VoiceProjection(task, focusSection, selection, trust, detailMode, l2).command

Init ==
  /\ task = "enterTown"
  /\ focusSection = "Entry"
  /\ selection = "none"
  /\ trust = "na"
  /\ detailMode = "closed"
  /\ voiceLocale = "en"

Next ==
  ∃ t ∈ Tasks, s ∈ Selections, tr ∈ TrustStates, d ∈ DetailModes, l ∈ Locales:
    /\ t ∈ Tasks
    /\ s ∈ TaskSelectionSet[t]
    /\ tr ∈ TaskTrustSet[t]
    /\ d ∈ TaskDetailModeSet[t]
    /\ task' = t
    /\ focusSection' = TaskSection[t]
    /\ selection' = s
    /\ trust' = tr
    /\ detailMode' = d
    /\ voiceLocale' = l

Spec ==
  Init /\ [][Next]_vars

==============================================
