------------------------- MODULE ModalFirstWorkerContinuity -------------------------
EXTENDS Naturals, TLC

\* This model formalizes the modal-first navigation rule:
\* modal-first district work stays inside /app and keeps the page-scoped worker alive.
\* Standalone Atlas routes may exist only as redirect entry points, not as steady-state UX.

CONSTANTS Dummy

Paths == {"/start", "/app", "/atlas", "/atlas.html"}
ModalTargets == {"Atlas", "House", "TownHall", "Registry", "Pony", "Trainer"}
ModalSurfaces == ModalTargets \cup {"none"}
StandaloneTargets == {"none", "Atlas"}
WorkerEpochs == {0, 1, 2}
ActionNames == {
  "boot",
  "enterApp",
  "openAtlasModal",
  "openHouseModal",
  "openTownHallModal",
  "openRegistryModal",
  "openPonyModal",
  "openTrainerModal",
  "closeModal",
  "attemptStandaloneAtlas",
  "redirectStandaloneAtlas",
  "returnStart"
}
ModalActionNames == {
  "openAtlasModal",
  "openHouseModal",
  "openTownHallModal",
  "openRegistryModal",
  "openPonyModal",
  "openTrainerModal",
  "closeModal"
}

VARIABLES path, modalSurface, workerAlive, workerEpoch, prevWorkerEpoch, redirectPending, standaloneTarget, lastAction

vars == <<path, modalSurface, workerAlive, workerEpoch, prevWorkerEpoch, redirectPending, standaloneTarget, lastAction>>

NextWorkerEpoch(curr) ==
  IF curr = 0 THEN 1 ELSE 2

Init ==
  /\ path = "/start"
  /\ modalSurface = "none"
  /\ workerAlive = FALSE
  /\ workerEpoch = 0
  /\ prevWorkerEpoch = 0
  /\ redirectPending = FALSE
  /\ standaloneTarget = "none"
  /\ lastAction = "boot"

EnterApp ==
  /\ path = "/start"
  /\ path' = "/app"
  /\ modalSurface' = "none"
  /\ workerAlive' = TRUE
  /\ workerEpoch' = NextWorkerEpoch(workerEpoch)
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = FALSE
  /\ standaloneTarget' = "none"
  /\ lastAction' = "enterApp"

OpenModal(nextSurface) ==
  /\ nextSurface \in ModalTargets
  /\ path = "/app"
  /\ ~redirectPending
  /\ path' = "/app"
  /\ modalSurface' = nextSurface
  /\ workerAlive' = TRUE
  /\ workerEpoch' = workerEpoch
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = FALSE
  /\ standaloneTarget' = "none"
  /\ lastAction' =
      CASE nextSurface = "Atlas" -> "openAtlasModal"
        [] nextSurface = "House" -> "openHouseModal"
        [] nextSurface = "TownHall" -> "openTownHallModal"
        [] nextSurface = "Registry" -> "openRegistryModal"
        [] nextSurface = "Pony" -> "openPonyModal"
        [] OTHER -> "openTrainerModal"

CloseModal ==
  /\ path = "/app"
  /\ modalSurface # "none"
  /\ ~redirectPending
  /\ path' = "/app"
  /\ modalSurface' = "none"
  /\ workerAlive' = TRUE
  /\ workerEpoch' = workerEpoch
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = FALSE
  /\ standaloneTarget' = "none"
  /\ lastAction' = "closeModal"

AttemptStandaloneAtlas(nextPath) ==
  /\ nextPath \in {"/atlas", "/atlas.html"}
  /\ ~redirectPending
  /\ path' = nextPath
  /\ modalSurface' = "none"
  /\ workerAlive' = FALSE
  /\ workerEpoch' = workerEpoch
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = TRUE
  /\ standaloneTarget' = "Atlas"
  /\ lastAction' = "attemptStandaloneAtlas"

RedirectStandaloneAtlas ==
  /\ path \in {"/atlas", "/atlas.html"}
  /\ redirectPending
  /\ standaloneTarget = "Atlas"
  /\ path' = "/app"
  /\ modalSurface' = "Atlas"
  /\ workerAlive' = TRUE
  /\ workerEpoch' = NextWorkerEpoch(workerEpoch)
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = FALSE
  /\ standaloneTarget' = "none"
  /\ lastAction' = "redirectStandaloneAtlas"

ReturnStart ==
  /\ path = "/app"
  /\ modalSurface = "none"
  /\ ~redirectPending
  /\ path' = "/start"
  /\ modalSurface' = "none"
  /\ workerAlive' = FALSE
  /\ workerEpoch' = workerEpoch
  /\ prevWorkerEpoch' = workerEpoch
  /\ redirectPending' = FALSE
  /\ standaloneTarget' = "none"
  /\ lastAction' = "returnStart"

AnyOpenModal ==
  \E nextSurface \in ModalTargets : OpenModal(nextSurface)

AnyStandaloneAtlasAttempt ==
  \E nextPath \in {"/atlas", "/atlas.html"} : AttemptStandaloneAtlas(nextPath)

Next ==
  \/ EnterApp
  \/ AnyOpenModal
  \/ CloseModal
  \/ AnyStandaloneAtlasAttempt
  \/ RedirectStandaloneAtlas
  \/ ReturnStart

TypeOK ==
  /\ path \in Paths
  /\ modalSurface \in ModalSurfaces
  /\ workerAlive \in BOOLEAN
  /\ workerEpoch \in WorkerEpochs
  /\ prevWorkerEpoch \in WorkerEpochs
  /\ redirectPending \in BOOLEAN
  /\ standaloneTarget \in StandaloneTargets
  /\ lastAction \in ActionNames

AppPathHasWorker ==
  path = "/app" => workerAlive /\ workerEpoch > 0

ModalRequiresApp ==
  modalSurface # "none" => path = "/app"

ModalRequiresWorker ==
  modalSurface # "none" => workerAlive

NonAppPathHasNoModal ==
  path # "/app" => modalSurface = "none"

SteadyStandaloneAtlasForbidden ==
  path \in {"/atlas", "/atlas.html"} => redirectPending

RedirectStateWellFormed ==
  redirectPending =>
    /\ path \in {"/atlas", "/atlas.html"}
    /\ standaloneTarget = "Atlas"
    /\ modalSurface = "none"
    /\ ~workerAlive

SteadyAppClearsStandaloneTarget ==
  path = "/app" /\ ~redirectPending => standaloneTarget = "none"

ModalOpenClosePreserveWorkerEpoch ==
  lastAction \in ModalActionNames => workerEpoch = prevWorkerEpoch

RedirectOpensAtlasInApp ==
  lastAction = "redirectStandaloneAtlas" => /\ path = "/app" /\ modalSurface = "Atlas" /\ workerAlive

Spec ==
  Init /\ [][Next]_vars

=============================================================================
