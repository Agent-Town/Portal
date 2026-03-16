---- MODULE SurfaceSimplicityModel ----
EXTENDS FiniteSets

(*
  Formalizes the default-view simplicity rule:

  - one active surface
  - one primary action per surface state
  - summary-first default view
  - dense facts stay out of the default view
  - the assistant remains available when depth is hidden
*)

CONSTANT Dummy

Surfaces ==
  {
    "Start",
    "Town",
    "HouseConsole",
    "HouseOffice",
    "Registry",
    "Create",
    "Trainer",
    "Brain",
    "Leaderboard",
    "Dock"
  }

Facts ==
  {
    "HeroSummary",
    "PrimaryAction",
    "ShortStatus",
    "SummaryCard",
    "NextStep",
    "Readiness",
    "Assignments",
    "Sessions",
    "ProviderConfig",
    "RuntimeLease",
    "Provenance",
    "RawIds",
    "History"
  }

DenseFacts ==
  {"Assignments", "Sessions", "ProviderConfig", "RuntimeLease", "Provenance", "RawIds", "History"}

PrimaryActions(s) ==
  CASE s = "Start" -> {"Enter"}
    [] s = "Town" -> {"OpenDistrict"}
    [] s = "HouseConsole" -> {"OpenOffice"}
    [] s = "HouseOffice" -> {"ReviewOverview"}
    [] s = "Registry" -> {"Search"}
    [] s = "Create" -> {"Share"}
    [] s = "Trainer" -> {"Run"}
    [] s = "Brain" -> {"ConnectBrain"}
    [] s = "Leaderboard" -> {"ViewRankings"}
    [] s = "Dock" -> {"SendMessage"}
    [] OTHER -> {}

SummaryAllowed(s) ==
  CASE s = "Start" -> {"HeroSummary", "PrimaryAction", "ShortStatus"}
    [] s = "Town" -> {"SummaryCard", "PrimaryAction", "NextStep"}
    [] s = "HouseConsole" -> {"SummaryCard", "PrimaryAction", "ShortStatus", "Readiness"}
    [] s = "HouseOffice" -> {"SummaryCard", "PrimaryAction", "ShortStatus", "Readiness"}
    [] s = "Registry" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] s = "Create" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] s = "Trainer" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] s = "Brain" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] s = "Leaderboard" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] s = "Dock" -> {"SummaryCard", "PrimaryAction", "ShortStatus"}
    [] OTHER -> {}

MaxSummaryFacts(s) ==
  CASE s = "Start" -> 3
    [] s = "Town" -> 3
    [] OTHER -> 4

VARIABLES surface, primaryAction, summaryFacts, advancedOpen, assistantAvailable

vars == <<surface, primaryAction, summaryFacts, advancedOpen, assistantAvailable>>

Init ==
  /\ surface = "Start"
  /\ primaryAction = "Enter"
  /\ summaryFacts = {"HeroSummary", "PrimaryAction"}
  /\ advancedOpen = FALSE
  /\ assistantAvailable = TRUE

OpenSurface(s) ==
  /\ s \in Surfaces
  /\ surface' = s
  /\ primaryAction' \in PrimaryActions(s)
  /\ summaryFacts' \subseteq SummaryAllowed(s)
  /\ Cardinality(summaryFacts') <= MaxSummaryFacts(s)
  /\ advancedOpen' = FALSE
  /\ assistantAvailable' = assistantAvailable

ChangePrimaryAction(a) ==
  /\ a \in PrimaryActions(surface)
  /\ primaryAction' = a
  /\ UNCHANGED <<surface, summaryFacts, advancedOpen, assistantAvailable>>

RefineSummary(fs) ==
  /\ fs \subseteq SummaryAllowed(surface)
  /\ Cardinality(fs) <= MaxSummaryFacts(surface)
  /\ summaryFacts' = fs
  /\ UNCHANGED <<surface, primaryAction, advancedOpen, assistantAvailable>>

ToggleAdvanced ==
  /\ advancedOpen' = ~advancedOpen
  /\ UNCHANGED <<surface, primaryAction, summaryFacts, assistantAvailable>>

SetAssistantAvailability(flag) ==
  /\ flag \in BOOLEAN
  /\ assistantAvailable' = flag
  /\ UNCHANGED <<surface, primaryAction, summaryFacts, advancedOpen>>

Next ==
  \/ \E s \in Surfaces: OpenSurface(s)
  \/ \E a \in PrimaryActions(surface): ChangePrimaryAction(a)
  \/ \E fs \in SUBSET SummaryAllowed(surface): RefineSummary(fs)
  \/ ToggleAdvanced
  \/ \E flag \in BOOLEAN: SetAssistantAvailability(flag)

Spec == Init /\ [][Next]_vars

TypeInv ==
  /\ surface \in Surfaces
  /\ primaryAction \in PrimaryActions(surface)
  /\ summaryFacts \subseteq Facts
  /\ advancedOpen \in BOOLEAN
  /\ assistantAvailable \in BOOLEAN

SummaryBoundInv ==
  Cardinality(summaryFacts) <= MaxSummaryFacts(surface)

DefaultViewSummaryOnlyInv ==
  ~advancedOpen => summaryFacts \subseteq SummaryAllowed(surface)

NoDenseFactsInDefaultInv ==
  ~advancedOpen => summaryFacts \cap DenseFacts = {}

AssistantSupportsHiddenDepthInv ==
  (~advancedOpen /\ DenseFacts # {}) => assistantAvailable

=============================================================================
