---- MODULE FoundersLoop ----
EXTENDS TLC

\* ZHC0 founders-loop state machine.
\* This is the formal/TLA+ companion to:
\* - docs/founders-loop-state-model.md
\* - machines/FoundersLoop.machine.ts
\* - design/specs/10_founders_loop_ui_state_projection.md
\* - design/specs/11_zhc0_ui_evidence_contract.md
\* - specs/43_zhc0_founders_loop_state_contract.md
\* - specs/44_zhc0_founders_loop_delivery_roadmap.md

SessionStates == {"none", "started", "authenticated"}
BrainStates == {"missing", "draft", "ready"}
FounderStates == {"missing", "named", "registered"}
AlignmentStates == {"locked", "sigil_matched", "open_pressed", "passed"}
CrestStates == {"missing", "in_progress", "created"}
HouseStates == {"missing", "initializing", "ready"}
MissionStates == {"not_started", "active", "completed", "failed"}
MemoryStates == {"none", "saved"}
NextQuestStates == {"hidden", "visible"}

VARIABLES
  sessionState,
  brainState,
  humanFounderState,
  agentFounderState,
  alignmentState,
  crestState,
  houseState,
  missionState,
  memoryState,
  nextQuestState

vars == <<
  sessionState,
  brainState,
  humanFounderState,
  agentFounderState,
  alignmentState,
  crestState,
  houseState,
  missionState,
  memoryState,
  nextQuestState
>>

Init ==
  /\ sessionState = "none"
  /\ brainState = "missing"
  /\ humanFounderState = "missing"
  /\ agentFounderState = "missing"
  /\ alignmentState = "locked"
  /\ crestState = "missing"
  /\ houseState = "missing"
  /\ missionState = "not_started"
  /\ memoryState = "none"
  /\ nextQuestState = "hidden"

FoundersRegistered ==
  /\ humanFounderState = "registered"
  /\ agentFounderState = "registered"

EnterTown ==
  /\ sessionState = "none"
  /\ sessionState' = "started"
  /\ UNCHANGED <<
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

Authenticate ==
  /\ sessionState = "started"
  /\ sessionState' = "authenticated"
  /\ UNCHANGED <<
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

ConfigureBrain ==
  /\ sessionState = "authenticated"
  /\ brainState \in {"missing", "draft"}
  /\ brainState' = "ready"
  /\ UNCHANGED <<
      sessionState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

NameHumanFounder ==
  /\ sessionState = "authenticated"
  /\ humanFounderState = "missing"
  /\ humanFounderState' = "named"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

RegisterHumanFounder ==
  /\ sessionState = "authenticated"
  /\ humanFounderState = "named"
  /\ humanFounderState' = "registered"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

NameAgentFounder ==
  /\ sessionState = "authenticated"
  /\ agentFounderState = "missing"
  /\ agentFounderState' = "named"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

RegisterAgentFounder ==
  /\ sessionState = "authenticated"
  /\ brainState = "ready"
  /\ agentFounderState = "named"
  /\ agentFounderState' = "registered"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

MatchSigil ==
  /\ sessionState = "authenticated"
  /\ alignmentState = "locked"
  /\ alignmentState' = "sigil_matched"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

PressOpen ==
  /\ alignmentState = "sigil_matched"
  /\ alignmentState' = "open_pressed"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

PassAlignment ==
  /\ alignmentState = "open_pressed"
  /\ FoundersRegistered
  /\ alignmentState' = "passed"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      crestState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

BeginCrest ==
  /\ alignmentState = "passed"
  /\ crestState = "missing"
  /\ crestState' = "in_progress"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

CompleteCrest ==
  /\ crestState = "in_progress"
  /\ crestState' = "created"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      houseState,
      missionState,
      memoryState,
      nextQuestState
     >>

InitializeHouse ==
  /\ sessionState = "authenticated"
  /\ crestState = "created"
  /\ houseState = "missing"
  /\ houseState' = "initializing"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      missionState,
      memoryState,
      nextQuestState
     >>

ActivateHouse ==
  /\ houseState = "initializing"
  /\ houseState' = "ready"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      missionState,
      memoryState,
      nextQuestState
     >>

StartFirstMission ==
  /\ sessionState = "authenticated"
  /\ houseState = "ready"
  /\ missionState = "not_started"
  /\ missionState' = "active"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      memoryState,
      nextQuestState
     >>

CompleteFirstMission ==
  /\ missionState = "active"
  /\ missionState' = "completed"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      memoryState,
      nextQuestState
     >>

FailFirstMission ==
  /\ missionState = "active"
  /\ missionState' = "failed"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      memoryState,
      nextQuestState
     >>

SaveFirstMemory ==
  /\ missionState = "completed"
  /\ memoryState = "none"
  /\ memoryState' = "saved"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      nextQuestState
     >>

RevealNextQuest ==
  /\ memoryState = "saved"
  /\ nextQuestState = "hidden"
  /\ nextQuestState' = "visible"
  /\ UNCHANGED <<
      sessionState,
      brainState,
      humanFounderState,
      agentFounderState,
      alignmentState,
      crestState,
      houseState,
      missionState,
      memoryState
     >>

Next ==
  \/ EnterTown
  \/ Authenticate
  \/ ConfigureBrain
  \/ NameHumanFounder
  \/ RegisterHumanFounder
  \/ NameAgentFounder
  \/ RegisterAgentFounder
  \/ MatchSigil
  \/ PressOpen
  \/ PassAlignment
  \/ BeginCrest
  \/ CompleteCrest
  \/ InitializeHouse
  \/ ActivateHouse
  \/ StartFirstMission
  \/ CompleteFirstMission
  \/ FailFirstMission
  \/ SaveFirstMemory
  \/ RevealNextQuest

Spec == Init /\ [][Next]_vars

TypeInvariant ==
  /\ sessionState \in SessionStates
  /\ brainState \in BrainStates
  /\ humanFounderState \in FounderStates
  /\ agentFounderState \in FounderStates
  /\ alignmentState \in AlignmentStates
  /\ crestState \in CrestStates
  /\ houseState \in HouseStates
  /\ missionState \in MissionStates
  /\ memoryState \in MemoryStates
  /\ nextQuestState \in NextQuestStates

NextQuestRequiresMemory ==
  nextQuestState = "visible" => memoryState = "saved"

MemoryRequiresCompletedMission ==
  memoryState = "saved" => missionState = "completed"

MissionRequiresHouse ==
  missionState \in {"active", "completed", "failed"} => houseState = "ready"

HouseRequiresCrest ==
  houseState = "ready" => crestState = "created"

CrestRequiresAlignment ==
  crestState = "created" => alignmentState = "passed"

AlignmentRequiresFounders ==
  alignmentState = "passed" => FoundersRegistered

AgentFounderRequiresBrain ==
  agentFounderState = "registered" => brainState = "ready"

CompletedMissionRequiresAuth ==
  missionState = "completed" => sessionState = "authenticated"

LoopComplete ==
  /\ sessionState = "authenticated"
  /\ brainState = "ready"
  /\ FoundersRegistered
  /\ alignmentState = "passed"
  /\ crestState = "created"
  /\ houseState = "ready"
  /\ missionState = "completed"
  /\ memoryState = "saved"
  /\ nextQuestState = "visible"

====
