---- MODULE ModalContinuityAndDisclosure ----
EXTENDS Naturals

(*
  Formalizes the modal-first continuity rule:

  - modal work stays on the hub route
  - worker continuity survives modal open/close
  - advanced disclosure changes visibility, not product truth
*)

Routes == {"Start", "App", "House", "Leaderboard", "Inbox", "Registry", "Create"}
ModalKinds == {"None", "District", "Trainer"}
Surfaces == {"Town", "House", "HouseOffice", "Registry", "Create", "Trainer"}

VARIABLES route, modal, activeSurface, workerAlive, workerSessionId, advancedOpen, truthRevision

vars == <<route, modal, activeSurface, workerAlive, workerSessionId, advancedOpen, truthRevision>>

Init ==
  /\ route = "App"
  /\ modal = "None"
  /\ activeSurface = "Town"
  /\ workerAlive = TRUE
  /\ workerSessionId = 1
  /\ advancedOpen = FALSE
  /\ truthRevision = 0

OpenDistrict(s) ==
  /\ s \in Surfaces
  /\ s # "Trainer"
  /\ route = "App"
  /\ modal = "None"
  /\ modal' = "District"
  /\ activeSurface' = s
  /\ UNCHANGED <<route, workerAlive, workerSessionId, advancedOpen, truthRevision>>

OpenTrainer ==
  /\ route = "App"
  /\ modal = "None"
  /\ modal' = "Trainer"
  /\ activeSurface' = "Trainer"
  /\ UNCHANGED <<route, workerAlive, workerSessionId, advancedOpen, truthRevision>>

CloseModal ==
  /\ modal # "None"
  /\ modal' = "None"
  /\ UNCHANGED <<route, activeSurface, workerAlive, workerSessionId, advancedOpen, truthRevision>>

SwitchSurface(s) ==
  /\ s \in Surfaces
  /\ route = "App"
  /\ modal = "District"
  /\ activeSurface' = s
  /\ UNCHANGED <<route, modal, workerAlive, workerSessionId, advancedOpen, truthRevision>>

ToggleAdvanced ==
  /\ advancedOpen' = ~advancedOpen
  /\ UNCHANGED <<route, modal, activeSurface, workerAlive, workerSessionId, truthRevision>>

UpdateTruth ==
  /\ truthRevision' = truthRevision + 1
  /\ UNCHANGED <<route, modal, activeSurface, workerAlive, workerSessionId, advancedOpen>>

HardNavigate(r) ==
  /\ r \in Routes
  /\ modal = "None"
  /\ route' = r
  /\ activeSurface' = activeSurface
  /\ workerAlive' = IF r = "App" THEN workerAlive ELSE FALSE
  /\ workerSessionId' = IF r = "App" THEN workerSessionId ELSE workerSessionId + 1
  /\ advancedOpen' = FALSE
  /\ UNCHANGED <<modal, truthRevision>>

Next ==
  \/ \E s \in Surfaces: OpenDistrict(s)
  \/ OpenTrainer
  \/ CloseModal
  \/ \E s \in Surfaces: SwitchSurface(s)
  \/ ToggleAdvanced
  \/ UpdateTruth
  \/ \E r \in Routes: HardNavigate(r)

Spec == Init /\ [][Next]_vars

TypeInv ==
  /\ route \in Routes
  /\ modal \in ModalKinds
  /\ activeSurface \in Surfaces
  /\ workerAlive \in BOOLEAN
  /\ workerSessionId \in Nat
  /\ advancedOpen \in BOOLEAN
  /\ truthRevision \in Nat

ModalUsesHubRouteInv ==
  modal # "None" => route = "App"

WorkerAliveInModalInv ==
  modal # "None" => workerAlive

TrainerModalMatchesSurfaceInv ==
  modal = "Trainer" => activeSurface = "Trainer"

=============================================================================
