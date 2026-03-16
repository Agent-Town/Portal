---- MODULE NoDriftSummaryDetailAssistant ----
EXTENDS FiniteSets

(*
  Formalizes the no-drift rule:

  - canonical truth is the source of meaning
  - summary, advanced, and assistant layers expose different depth
  - those layers must not contradict each other
*)

Facts ==
  {
    "PrimaryAction",
    "CurrentStatus",
    "Readiness",
    "Warnings",
    "ProviderConfig",
    "RuntimeLease",
    "Provenance",
    "RawIds",
    "History"
  }

SummarySafeFacts == {"PrimaryAction", "CurrentStatus", "Readiness", "Warnings"}

Values == {"Absent", "Present", "Ready", "Blocked", "Stale", "Error"}

VARIABLES canonicalTruth, summaryVisible, advancedVisible, assistantVisible

vars == <<canonicalTruth, summaryVisible, advancedVisible, assistantVisible>>

SummaryProjection ==
  [f \in summaryVisible |-> canonicalTruth[f]]

AdvancedProjection ==
  [f \in advancedVisible |-> canonicalTruth[f]]

AssistantProjection ==
  [f \in assistantVisible |-> canonicalTruth[f]]

Init ==
  /\ canonicalTruth \in [Facts -> Values]
  /\ summaryVisible \subseteq SummarySafeFacts
  /\ advancedVisible \in SUBSET Facts
  /\ assistantVisible = Facts
  /\ summaryVisible \subseteq advancedVisible

UpdateCanonical(f, v) ==
  /\ f \in Facts
  /\ v \in Values
  /\ canonicalTruth' = [canonicalTruth EXCEPT ![f] = v]
  /\ UNCHANGED <<summaryVisible, advancedVisible, assistantVisible>>

SetSummaryVisible(vis) ==
  /\ vis \subseteq SummarySafeFacts
  /\ vis \subseteq advancedVisible
  /\ summaryVisible' = vis
  /\ UNCHANGED <<canonicalTruth, advancedVisible, assistantVisible>>

SetAdvancedVisible(vis) ==
  /\ vis \subseteq Facts
  /\ summaryVisible \subseteq vis
  /\ advancedVisible' = vis
  /\ UNCHANGED <<canonicalTruth, summaryVisible, assistantVisible>>

RefreshAssistant ==
  /\ assistantVisible' = Facts
  /\ UNCHANGED <<canonicalTruth, summaryVisible, advancedVisible>>

Next ==
  \/ \E f \in Facts:
       \E v \in Values:
         UpdateCanonical(f, v)
  \/ \E vis \in SUBSET SummarySafeFacts: SetSummaryVisible(vis)
  \/ \E vis \in SUBSET Facts: SetAdvancedVisible(vis)
  \/ RefreshAssistant

Spec == Init /\ [][Next]_vars

TypeInv ==
  /\ canonicalTruth \in [Facts -> Values]
  /\ summaryVisible \subseteq Facts
  /\ advancedVisible \subseteq Facts
  /\ assistantVisible \subseteq Facts

NoDriftSubsetInv ==
  /\ summaryVisible \subseteq advancedVisible
  /\ advancedVisible \subseteq assistantVisible

SummarySafeInv ==
  summaryVisible \subseteq SummarySafeFacts

AssistantCoverageInv ==
  assistantVisible = Facts

ProjectionConsistencyInv ==
  /\ \A f \in summaryVisible: SummaryProjection[f] = canonicalTruth[f]
  /\ \A f \in advancedVisible: AdvancedProjection[f] = canonicalTruth[f]
  /\ \A f \in assistantVisible: AssistantProjection[f] = canonicalTruth[f]

=============================================================================
