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

TaskRoom(t) ==
  CASE t = "enterTown" -> "Start"
    [] t = "openLibrary" -> "Town"
    [] t = "openTownHall" -> "Town"
    [] t = "openWorkshop" -> "Town"
    [] t = "setupIdentity" -> "TownHall"
    [] t = "saveArtifact" -> "HouseLibrary"
    [] t = "openArtifact" -> "HouseLibrary"
    [] t = "reviewTrust" -> "HouseLibrary"
    [] t = "receiveDelivery" -> "HouseLibrary"
    [] t = "hideArtifact" -> "HouseLibrary"
    [] OTHER -> "HouseLibrary"

TaskSection(task) ==
  CASE task = "enterTown" -> "Entry"
    [] task = "openLibrary" -> "Library"
    [] task = "openTownHall" -> "TownHall"
    [] task = "openWorkshop" -> "Workshop"
    [] task = "setupIdentity" -> "TownHall"
    [] task = "saveArtifact" -> "KeepBox"
    [] task = "openArtifact" -> "MemoryTable"
    [] task = "reviewTrust" -> "TrustedFinds"
    [] task = "receiveDelivery" -> "Deliveries"
    [] task = "hideArtifact" -> "HiddenShelf"
    [] OTHER -> "RouteDesk"

TaskSelectionSet(task) ==
  CASE task = "enterTown" -> {"none"}
    [] task = "openLibrary" -> {"none"}
    [] task = "openTownHall" -> {"none"}
    [] task = "openWorkshop" -> {"none"}
    [] task = "setupIdentity" -> {"none"}
    [] task = "saveArtifact" -> {"none"}
    [] task = "openArtifact" -> {"none", "artifact"}
    [] task = "reviewTrust" -> {"none", "publicStack"}
    [] task = "receiveDelivery" -> {"none", "delivery"}
    [] task = "hideArtifact" -> {"none", "hiddenStack"}
    [] OTHER -> {"none", "routeStack"}

TaskTrustSet(task) ==
  CASE task = "enterTown" -> {"na"}
    [] task = "openLibrary" -> {"na"}
    [] task = "openTownHall" -> {"na"}
    [] task = "openWorkshop" -> {"na"}
    [] task = "setupIdentity" -> {"na"}
    [] task = "saveArtifact" -> {"na"}
    [] task = "openArtifact" -> {"na"}
    [] task = "reviewTrust" -> {"unknown", "verified", "blocked"}
    [] task = "receiveDelivery" -> {"na"}
    [] task = "hideArtifact" -> {"blocked"}
    [] OTHER -> {"unknown", "verified"}

TaskDetailModeSet(task) ==
  CASE task = "enterTown" -> {"closed"}
    [] task = "openLibrary" -> {"closed"}
    [] task = "openTownHall" -> {"closed"}
    [] task = "openWorkshop" -> {"closed"}
    [] task = "setupIdentity" -> {"closed", "advanced"}
    [] task = "saveArtifact" -> {"closed", "itemDetail"}
    [] task = "openArtifact" -> {"closed", "itemDetail", "provenance"}
    [] task = "reviewTrust" -> {"closed", "itemDetail", "provenance"}
    [] task = "receiveDelivery" -> {"closed", "itemDetail", "provenance"}
    [] task = "hideArtifact" -> {"closed", "itemDetail"}
    [] OTHER -> {"closed", "itemDetail", "provenance"}

CommandForTask(task) ==
  CASE task = "enterTown" -> "cmd.enterTown"
    [] task = "openLibrary" -> "cmd.openLibrary"
    [] task = "openTownHall" -> "cmd.openTownHall"
    [] task = "openWorkshop" -> "cmd.openWorkshop"
    [] task = "setupIdentity" -> "cmd.setupIdentity"
    [] task = "saveArtifact" -> "cmd.saveArtifact"
    [] task = "openArtifact" -> "cmd.openArtifact"
    [] task = "reviewTrust" -> "cmd.reviewTrust"
    [] task = "receiveDelivery" -> "cmd.receiveDelivery"
    [] task = "hideArtifact" -> "cmd.hideArtifact"
    [] OTHER -> "cmd.followRoute"

VoiceAlias(locale, command) ==
  CASE locale = "en" ->
    CASE command = "cmd.enterTown" -> "go_to_town"
      [] command = "cmd.openLibrary" -> "open_library"
      [] command = "cmd.openTownHall" -> "open_town_hall"
      [] command = "cmd.openWorkshop" -> "open_workshop"
      [] command = "cmd.setupIdentity" -> "continue"
      [] command = "cmd.saveArtifact" -> "save_to_memory"
      [] command = "cmd.openArtifact" -> "open_item"
      [] command = "cmd.reviewTrust" -> "check_source"
      [] command = "cmd.receiveDelivery" -> "open_delivery"
      [] command = "cmd.hideArtifact" -> "hide_item"
      [] OTHER -> "follow_route"
    [] locale = "zh" ->
      CASE command = "cmd.enterTown" -> "go_to_town_zh"
        [] command = "cmd.openLibrary" -> "open_library_zh"
        [] command = "cmd.openTownHall" -> "open_town_hall_zh"
        [] command = "cmd.openWorkshop" -> "open_workshop_zh"
        [] command = "cmd.setupIdentity" -> "continue_zh"
        [] command = "cmd.saveArtifact" -> "save_to_memory_zh"
        [] command = "cmd.openArtifact" -> "open_item_zh"
        [] command = "cmd.reviewTrust" -> "check_source_zh"
        [] command = "cmd.receiveDelivery" -> "open_delivery_zh"
        [] command = "cmd.hideArtifact" -> "hide_item_zh"
        [] OTHER -> "follow_route_zh"
    [] OTHER -> ""

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

PrimaryActionFact(task, selection) ==
  CASE PrimaryVerbOf(task, selection) = "go" -> "action.go"
    [] PrimaryVerbOf(task, selection) = "open" -> "action.open"
    [] PrimaryVerbOf(task, selection) = "continue" -> "action.continue"
    [] PrimaryVerbOf(task, selection) = "save" -> "action.save"
    [] PrimaryVerbOf(task, selection) = "check" -> "action.check"
    [] PrimaryVerbOf(task, selection) = "hide" -> "action.hide"
    [] PrimaryVerbOf(task, selection) = "follow" -> "action.follow"
    [] PrimaryVerbOf(task, selection) = "bring" -> "action.bring"
    [] OTHER -> "action.share"

RoomFact(task) ==
  CASE TaskRoom(task) = "Start" -> "room.Start"
    [] TaskRoom(task) = "Town" -> "room.Town"
    [] TaskRoom(task) = "HouseLibrary" -> "room.HouseLibrary"
    [] TaskRoom(task) = "TownHall" -> "room.TownHall"
    [] OTHER -> "room.Unknown"

TaskFact(task) ==
  CASE task = "enterTown" -> "task.enterTown"
    [] task = "openLibrary" -> "task.openLibrary"
    [] task = "openTownHall" -> "task.openTownHall"
    [] task = "openWorkshop" -> "task.openWorkshop"
    [] task = "setupIdentity" -> "task.setupIdentity"
    [] task = "saveArtifact" -> "task.saveArtifact"
    [] task = "openArtifact" -> "task.openArtifact"
    [] task = "reviewTrust" -> "task.reviewTrust"
    [] task = "receiveDelivery" -> "task.receiveDelivery"
    [] task = "hideArtifact" -> "task.hideArtifact"
    [] OTHER -> "task.followRoute"

SectionFact(section) ==
  CASE section = "Entry" -> "section.Entry"
    [] section = "Library" -> "section.Library"
    [] section = "TownHall" -> "section.TownHall"
    [] section = "Workshop" -> "section.Workshop"
    [] section = "KeepBox" -> "section.KeepBox"
    [] section = "MemoryTable" -> "section.MemoryTable"
    [] section = "TrustedFinds" -> "section.TrustedFinds"
    [] section = "Deliveries" -> "section.Deliveries"
    [] section = "HiddenShelf" -> "section.HiddenShelf"
    [] OTHER -> "section.RouteDesk"

SelectionFact(selection) ==
  CASE selection = "none" -> "selection.none"
    [] selection = "artifact" -> "selection.artifact"
    [] selection = "publicStack" -> "selection.publicStack"
    [] selection = "delivery" -> "selection.delivery"
    [] selection = "hiddenStack" -> "selection.hiddenStack"
    [] OTHER -> "selection.routeStack"

TrustFact(trust) ==
  CASE trust = "na" -> "trust.na"
    [] trust = "unknown" -> "trust.unknown"
    [] trust = "verified" -> "trust.verified"
    [] OTHER -> "trust.blocked"

DetailFact(detailMode) ==
  CASE detailMode = "closed" -> "detail.closed"
    [] detailMode = "itemDetail" -> "detail.itemDetail"
    [] detailMode = "provenance" -> "detail.provenance"
    [] OTHER -> "detail.advanced"

LocaleFact(locale) ==
  CASE locale = "en" -> "locale.en"
    [] locale = "zh" -> "locale.zh"
    [] OTHER -> "locale.unknown"

GoalFact(task) ==
  CASE task = "enterTown" -> "goal.enterTown"
    [] task = "openLibrary" -> "goal.openLibrary"
    [] task = "openTownHall" -> "goal.openTownHall"
    [] task = "openWorkshop" -> "goal.openWorkshop"
    [] task = "setupIdentity" -> "goal.setupIdentity"
    [] task = "saveArtifact" -> "goal.saveArtifact"
    [] task = "openArtifact" -> "goal.openArtifact"
    [] task = "reviewTrust" -> "goal.reviewTrust"
    [] task = "receiveDelivery" -> "goal.receiveDelivery"
    [] task = "hideArtifact" -> "goal.hideArtifact"
    [] OTHER -> "goal.followRoute"

VerbFact(task, selection) ==
  CASE PrimaryVerbOf(task, selection) = "go" -> "verb.go"
    [] PrimaryVerbOf(task, selection) = "open" -> "verb.open"
    [] PrimaryVerbOf(task, selection) = "continue" -> "verb.continue"
    [] PrimaryVerbOf(task, selection) = "save" -> "verb.save"
    [] PrimaryVerbOf(task, selection) = "check" -> "verb.check"
    [] PrimaryVerbOf(task, selection) = "hide" -> "verb.hide"
    [] PrimaryVerbOf(task, selection) = "follow" -> "verb.follow"
    [] PrimaryVerbOf(task, selection) = "bring" -> "verb.bring"
    [] OTHER -> "verb.share"

CommandFact(task) ==
  CASE CommandForTask(task) = "cmd.enterTown" -> "command.cmd.enterTown"
    [] CommandForTask(task) = "cmd.openLibrary" -> "command.cmd.openLibrary"
    [] CommandForTask(task) = "cmd.openTownHall" -> "command.cmd.openTownHall"
    [] CommandForTask(task) = "cmd.openWorkshop" -> "command.cmd.openWorkshop"
    [] CommandForTask(task) = "cmd.setupIdentity" -> "command.cmd.setupIdentity"
    [] CommandForTask(task) = "cmd.saveArtifact" -> "command.cmd.saveArtifact"
    [] CommandForTask(task) = "cmd.openArtifact" -> "command.cmd.openArtifact"
    [] CommandForTask(task) = "cmd.reviewTrust" -> "command.cmd.reviewTrust"
    [] CommandForTask(task) = "cmd.receiveDelivery" -> "command.cmd.receiveDelivery"
    [] CommandForTask(task) = "cmd.hideArtifact" -> "command.cmd.hideArtifact"
    [] OTHER -> "command.cmd.followRoute"

VoiceCommandFact(task) ==
  CASE task = "enterTown" -> "voice.command.cmd.enterTown"
    [] task = "openLibrary" -> "voice.command.cmd.openLibrary"
    [] task = "openTownHall" -> "voice.command.cmd.openTownHall"
    [] task = "openWorkshop" -> "voice.command.cmd.openWorkshop"
    [] task = "setupIdentity" -> "voice.command.cmd.setupIdentity"
    [] task = "saveArtifact" -> "voice.command.cmd.saveArtifact"
    [] task = "openArtifact" -> "voice.command.cmd.openArtifact"
    [] task = "reviewTrust" -> "voice.command.cmd.reviewTrust"
    [] task = "receiveDelivery" -> "voice.command.cmd.receiveDelivery"
    [] task = "hideArtifact" -> "voice.command.cmd.hideArtifact"
    [] OTHER -> "voice.command.cmd.followRoute"

VoicePhraseFact(locale, task) ==
  CASE locale = "en" ->
    CASE task = "enterTown" -> "voice.phrase.go_to_town"
      [] task = "openLibrary" -> "voice.phrase.open_library"
      [] task = "openTownHall" -> "voice.phrase.open_town_hall"
      [] task = "openWorkshop" -> "voice.phrase.open_workshop"
      [] task = "setupIdentity" -> "voice.phrase.continue"
      [] task = "saveArtifact" -> "voice.phrase.save_to_memory"
      [] task = "openArtifact" -> "voice.phrase.open_item"
      [] task = "reviewTrust" -> "voice.phrase.check_source"
      [] task = "receiveDelivery" -> "voice.phrase.open_delivery"
      [] task = "hideArtifact" -> "voice.phrase.hide_item"
      [] OTHER -> "voice.phrase.follow_route"
    [] locale = "zh" ->
      CASE task = "enterTown" -> "voice.phrase.go_to_town_zh"
        [] task = "openLibrary" -> "voice.phrase.open_library_zh"
        [] task = "openTownHall" -> "voice.phrase.open_town_hall_zh"
        [] task = "openWorkshop" -> "voice.phrase.open_workshop_zh"
        [] task = "setupIdentity" -> "voice.phrase.continue_zh"
        [] task = "saveArtifact" -> "voice.phrase.save_to_memory_zh"
        [] task = "openArtifact" -> "voice.phrase.open_item_zh"
        [] task = "reviewTrust" -> "voice.phrase.check_source_zh"
        [] task = "receiveDelivery" -> "voice.phrase.open_delivery_zh"
        [] task = "hideArtifact" -> "voice.phrase.hide_item_zh"
        [] OTHER -> "voice.phrase.follow_route_zh"
    [] OTHER -> ""

HumanCoreFacts(task, focusSection, selection, trust, detailMode, locale) ==
  {
    RoomFact(task),
    TaskFact(task),
    SectionFact(focusSection),
    SelectionFact(selection),
    TrustFact(trust),
    DetailFact(detailMode),
    LocaleFact(locale),
    GoalFact(task),
    PrimaryActionFact(task, selection),
    VerbFact(task, selection)
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
    CommandFact(task),
    VoiceCommandFact(task),
    VoicePhraseFact(locale, task)
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
    room |-> TaskRoom(task),
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
    room |-> TaskRoom(task),
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask(task),
    facts |-> AdvancedFacts(task, focusSection, selection, trust, detailMode, locale)
  ]

LLMProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom(task),
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask(task),
    facts |-> LLMFacts(task, focusSection, selection, trust, detailMode, locale)
  ]

VoiceProjection(task, focusSection, selection, trust, detailMode, locale) ==
  [
    room |-> TaskRoom(task),
    task |-> task,
    focus |-> focusSection,
    selection |-> selection,
    trust |-> trust,
    detail |-> detailMode,
    locale |-> locale,
    primaryAction |-> PrimaryVerbOf(task, selection),
    command |-> CommandForTask(task),
    phrase |-> VoiceAlias(locale, task),
    facts |-> {
      LocaleFact(locale),
      VoiceCommandFact(task),
      VoicePhraseFact(locale, task)
    }
  ]

VARIABLES task, focusSection, selection, trust, detailMode, voiceLocale

vars == <<task, focusSection, selection, trust, detailMode, voiceLocale>>

TypeOK ==
  /\ task \in Tasks
  /\ focusSection \in Sections
  /\ selection \in Selections
  /\ trust \in TrustStates
  /\ detailMode \in DetailModes
  /\ voiceLocale \in Locales
  /\ focusSection = TaskSection(task)

TaskSelectionTrustFits ==
  /\ selection \in TaskSelectionSet(task)
  /\ trust \in TaskTrustSet(task)
  /\ detailMode \in TaskDetailModeSet(task)

TaskRoomKnown ==
  TaskRoom(task) \in Rooms

CanonicalVerbValid ==
  PrimaryVerbOf(task, selection) \in Verbs

HumanSimple ==
  Cardinality(HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts \cap {
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
    \subseteq CanonicalFacts(task, focusSection, selection, trust, detailMode, voiceLocale)

LLMCompleteness ==
    HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    \subseteq LLMProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

AdvancedSuperset ==
    HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    \subseteq AdvancedProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts

NoTechnicalLeakInHuman ==
  HumanProjection(task, focusSection, selection, trust, detailMode, voiceLocale).facts
    \cap {"technical.artifactId", "technical.revisionChain", "technical.provenanceReceipt", "technical.trustProof", "technical.routeId", "technical.relayReceipt"} = {}

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
  \A t \in Tasks, l \in Locales:
    VoiceAlias(l, CommandForTask(t)) # ""

NoLocaleAliasCollision ==
  \A l \in Locales:
    \A t1, t2 \in Tasks:
      t1 # t2 =>
        VoiceAlias(l, CommandForTask(t1)) # VoiceAlias(l, CommandForTask(t2))

LocaleSwitchOnlyCommandStable ==
  \A l1, l2 \in Locales:
    CommandForTask(task) =
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
  \E t \in Tasks, s \in Selections, tr \in TrustStates, d \in DetailModes, l \in Locales:
    /\ t \in Tasks
  /\ s \in TaskSelectionSet(t)
  /\ tr \in TaskTrustSet(t)
  /\ d \in TaskDetailModeSet(t)
    /\ task' = t
    /\ focusSection' = TaskSection(t)
    /\ selection' = s
    /\ trust' = tr
    /\ detailMode' = d
    /\ voiceLocale' = l

Spec ==
  Init /\ [][Next]_vars

==============================================
