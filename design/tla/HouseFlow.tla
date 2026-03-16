---- MODULE HouseFlow ----
EXTENDS TLC

\* Bounded model for the first-viewport House narrative.
\* The goal is to keep House understandable without turning it into a flat control stack.

CONSTANTS Locales

VARIABLES houseState, firstBlock, advancedExpanded, detailLayer,
          assistantAvailable, primaryActionCount, locale

Vars ==
  << houseState, firstBlock, advancedExpanded, detailLayer,
     assistantAvailable, primaryActionCount, locale >>

TypeInv ==
  /\ houseState \in {"needs_unlock", "ready", "recovery", "sharing"}
  /\ firstBlock \in {"unlock", "continuity", "share", "advanced"}
  /\ advancedExpanded \in BOOLEAN
  /\ detailLayer \in {"summary", "advanced"}
  /\ assistantAvailable \in BOOLEAN
  /\ primaryActionCount \in {1}
  /\ locale \in Locales

Init ==
  /\ houseState \in {"needs_unlock", "ready", "recovery", "sharing"}
  /\ firstBlock =
      IF houseState = "needs_unlock" THEN "unlock"
      ELSE "continuity"
  /\ advancedExpanded = FALSE
  /\ detailLayer = "summary"
  /\ assistantAvailable = TRUE
  /\ primaryActionCount = 1
  /\ locale \in Locales

UnlockSatisfied ==
  /\ houseState = "needs_unlock"
  /\ houseState' = "ready"
  /\ firstBlock' = "continuity"
  /\ UNCHANGED << advancedExpanded, detailLayer, assistantAvailable,
                  primaryActionCount, locale >>

EnterRecovery ==
  /\ houseState \in {"ready", "sharing"}
  /\ houseState' = "recovery"
  /\ firstBlock' = "continuity"
  /\ UNCHANGED << advancedExpanded, detailLayer, assistantAvailable,
                  primaryActionCount, locale >>

OpenSharing ==
  /\ houseState \in {"ready", "recovery"}
  /\ houseState' = "sharing"
  /\ firstBlock' = "continuity"
  /\ UNCHANGED << advancedExpanded, detailLayer, assistantAvailable,
                  primaryActionCount, locale >>

ToggleAdvanced ==
  /\ advancedExpanded' = ~advancedExpanded
  /\ UNCHANGED << houseState, firstBlock, detailLayer, assistantAvailable,
                  primaryActionCount, locale >>

PromoteDetail ==
  /\ ~assistantAvailable
  /\ detailLayer' = "advanced"
  /\ UNCHANGED << houseState, firstBlock, advancedExpanded,
                  assistantAvailable, primaryActionCount, locale >>

SimplifyDetail ==
  /\ detailLayer' = "summary"
  /\ UNCHANGED << houseState, firstBlock, advancedExpanded,
                  assistantAvailable, primaryActionCount, locale >>

ChangeLocale(l) ==
  /\ l \in Locales
  /\ locale' = l
  /\ UNCHANGED << houseState, firstBlock, advancedExpanded, detailLayer,
                  assistantAvailable, primaryActionCount >>

AssistantLeaves ==
  /\ assistantAvailable
  /\ assistantAvailable' = FALSE
  /\ UNCHANGED << houseState, firstBlock, advancedExpanded, detailLayer,
                  primaryActionCount, locale >>

AssistantReturns ==
  /\ ~assistantAvailable
  /\ assistantAvailable' = TRUE
  /\ UNCHANGED << houseState, firstBlock, advancedExpanded, detailLayer,
                  primaryActionCount, locale >>

Next ==
  \/ UnlockSatisfied
  \/ EnterRecovery
  \/ OpenSharing
  \/ ToggleAdvanced
  \/ AssistantLeaves
  \/ AssistantReturns
  \/ PromoteDetail
  \/ SimplifyDetail
  \/ (\E l \in Locales : ChangeLocale(l))

Spec ==
  Init /\ [][Next]_Vars

OnePrimaryAction ==
  primaryActionCount = 1

UnlockBeforeAdvanced ==
  (houseState = "needs_unlock") => (firstBlock = "unlock")

ContinuityBeforeSharing ==
  (houseState \in {"ready", "recovery", "sharing"}) => (firstBlock = "continuity")

AdvancedHiddenByDefault ==
  detailLayer = "summary" => ~advancedExpanded

AssistantCarriesDetail ==
  assistantAvailable => detailLayer = "summary"

====
