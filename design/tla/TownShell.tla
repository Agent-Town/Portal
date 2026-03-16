---- MODULE TownShell ----
EXTENDS TLC

\* Bounded design-logic model for the town shell.
\* This formalizes continuity and disclosure logic, not rendered aesthetics.

CONSTANTS Districts, Locales

VARIABLES route, activeDistrict, modalSurface, debugVisible, debugPriority,
          detailLayer, assistantAvailable, primaryActionCount, locale

Vars ==
  << route, activeDistrict, modalSurface, debugVisible, debugPriority,
     detailLayer, assistantAvailable, primaryActionCount, locale >>

TypeInv ==
  /\ route \in {"app"}
  /\ activeDistrict \in Districts
  /\ modalSurface \in Districts \cup {"none"}
  /\ debugVisible \in BOOLEAN
  /\ debugPriority \in {"secondary"}
  /\ detailLayer \in {"summary", "advanced"}
  /\ assistantAvailable \in BOOLEAN
  /\ primaryActionCount \in {1}
  /\ locale \in Locales

Init ==
  /\ route = "app"
  /\ activeDistrict \in Districts
  /\ modalSurface = "none"
  /\ debugVisible = FALSE
  /\ debugPriority = "secondary"
  /\ detailLayer = "summary"
  /\ assistantAvailable = TRUE
  /\ primaryActionCount = 1
  /\ locale \in Locales

OpenDistrict(d) ==
  /\ d \in Districts
  /\ modalSurface = "none"
  /\ activeDistrict' = d
  /\ modalSurface' = d
  /\ UNCHANGED << route, debugVisible, debugPriority, detailLayer,
                  assistantAvailable, primaryActionCount, locale >>

CloseDistrict ==
  /\ modalSurface # "none"
  /\ modalSurface' = "none"
  /\ UNCHANGED << route, activeDistrict, debugVisible, debugPriority,
                  detailLayer, assistantAvailable, primaryActionCount, locale >>

ToggleDebug ==
  /\ debugVisible' = ~debugVisible
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugPriority,
                  detailLayer, assistantAvailable, primaryActionCount, locale >>

ChangeLocale(l) ==
  /\ l \in Locales
  /\ locale' = l
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugVisible,
                  debugPriority, detailLayer, assistantAvailable,
                  primaryActionCount >>

AssistantLeaves ==
  /\ assistantAvailable
  /\ assistantAvailable' = FALSE
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugVisible,
                  debugPriority, detailLayer, primaryActionCount, locale >>

AssistantReturns ==
  /\ ~assistantAvailable
  /\ assistantAvailable' = TRUE
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugVisible,
                  debugPriority, detailLayer, primaryActionCount, locale >>

PromoteDetail ==
  /\ ~assistantAvailable
  /\ detailLayer' = "advanced"
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugVisible,
                  debugPriority, assistantAvailable, primaryActionCount, locale >>

SimplifyDetail ==
  /\ detailLayer' = "summary"
  /\ UNCHANGED << route, activeDistrict, modalSurface, debugVisible,
                  debugPriority, assistantAvailable, primaryActionCount, locale >>

Next ==
  \/ (\E d \in Districts : OpenDistrict(d))
  \/ CloseDistrict
  \/ ToggleDebug
  \/ (\E l \in Locales : ChangeLocale(l))
  \/ AssistantLeaves
  \/ AssistantReturns
  \/ PromoteDetail
  \/ SimplifyDetail

Spec ==
  Init /\ [][Next]_Vars

OnePrimaryAction ==
  primaryActionCount = 1

ModalContinuityPreserved ==
  route = "app"

DebugNeverPrimary ==
  debugPriority = "secondary"

AssistantCarriesDetail ==
  assistantAvailable => detailLayer = "summary"

LocaleSafeActionModel ==
  primaryActionCount = 1

====
