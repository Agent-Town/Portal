/**
 * FoundersLoop.machine.ts
 *
 * Status: formal-state scaffold for the first playable ZHC0 loop.
 *
 * Important:
 * - This file is intentionally NOT wired into the current app build.
 * - It is a machine-shaped source of truth that can later be translated into
 *   a TLA+/tla-precheck style verifier pipeline.
 * - For now it exists to make product, design, and test states explicit.
 */

export type SessionState = 'none' | 'started' | 'authenticated';
export type BrainState = 'missing' | 'draft' | 'ready';
export type FounderState = 'missing' | 'named' | 'registered';
export type AlignmentState = 'locked' | 'sigil_matched' | 'open_pressed' | 'passed';
export type CrestState = 'missing' | 'in_progress' | 'created';
export type HouseState = 'missing' | 'initializing' | 'ready';
export type MissionState = 'not_started' | 'active' | 'completed' | 'failed';
export type MemoryState = 'none' | 'saved';
export type NextQuestState = 'hidden' | 'visible';

export type UiOverlayState =
  | 'loading'
  | 'ready'
  | 'blocked'
  | 'needs_confirmation'
  | 'recoverable_error'
  | 'fatal_error'
  | 'success_feedback';

export type FoundersLoopPhase =
  | 'arrival'
  | 'first_worker_online'
  | 'founders_established'
  | 'alignment_passed'
  | 'crest_created'
  | 'hq_ready'
  | 'first_mission_completed'
  | 'first_memory_saved'
  | 'next_quest_visible';

export interface FoundersLoopState {
  sessionState: SessionState;
  brainState: BrainState;
  humanFounderState: FounderState;
  agentFounderState: FounderState;
  alignmentState: AlignmentState;
  crestState: CrestState;
  houseState: HouseState;
  missionState: MissionState;
  memoryState: MemoryState;
  nextQuestState: NextQuestState;
}

export const initialFoundersLoopState: FoundersLoopState = {
  sessionState: 'none',
  brainState: 'missing',
  humanFounderState: 'missing',
  agentFounderState: 'missing',
  alignmentState: 'locked',
  crestState: 'missing',
  houseState: 'missing',
  missionState: 'not_started',
  memoryState: 'none',
  nextQuestState: 'hidden'
};

export type FoundersLoopAction =
  | 'enterTown'
  | 'authenticate'
  | 'configureBrain'
  | 'nameHumanFounder'
  | 'registerHumanFounder'
  | 'nameAgentFounder'
  | 'registerAgentFounder'
  | 'matchSigil'
  | 'pressOpen'
  | 'passAlignment'
  | 'beginCrest'
  | 'completeCrest'
  | 'initializeHouse'
  | 'activateHouse'
  | 'startFirstMission'
  | 'completeFirstMission'
  | 'failFirstMission'
  | 'saveFirstMemory'
  | 'revealNextQuest';

export interface FoundersLoopTransition {
  action: FoundersLoopAction;
  from: Partial<FoundersLoopState>;
  to: Partial<FoundersLoopState>;
  notes?: string;
}

export const foundersLoopTransitions: FoundersLoopTransition[] = [
  {
    action: 'enterTown',
    from: { sessionState: 'none' },
    to: { sessionState: 'started' },
    notes: 'Player enters the product and the loop officially begins.'
  },
  {
    action: 'authenticate',
    from: { sessionState: 'started' },
    to: { sessionState: 'authenticated' },
    notes: 'Player completes the minimum auth/session requirement.'
  },
  {
    action: 'configureBrain',
    from: { brainState: 'missing' },
    to: { brainState: 'ready' },
    notes: 'The first worker/agent becomes ready enough to participate.'
  },
  {
    action: 'nameHumanFounder',
    from: { humanFounderState: 'missing' },
    to: { humanFounderState: 'named' }
  },
  {
    action: 'registerHumanFounder',
    from: { humanFounderState: 'named' },
    to: { humanFounderState: 'registered' }
  },
  {
    action: 'nameAgentFounder',
    from: { agentFounderState: 'missing' },
    to: { agentFounderState: 'named' }
  },
  {
    action: 'registerAgentFounder',
    from: { agentFounderState: 'named', brainState: 'ready' },
    to: { agentFounderState: 'registered' },
    notes: 'Agent cannot become a founder unless the brain/runtime is ready.'
  },
  {
    action: 'matchSigil',
    from: { alignmentState: 'locked' },
    to: { alignmentState: 'sigil_matched' }
  },
  {
    action: 'pressOpen',
    from: { alignmentState: 'sigil_matched' },
    to: { alignmentState: 'open_pressed' }
  },
  {
    action: 'passAlignment',
    from: {
      alignmentState: 'open_pressed',
      humanFounderState: 'registered',
      agentFounderState: 'registered'
    },
    to: { alignmentState: 'passed' },
    notes: 'Alignment cannot pass until both founders are real.'
  },
  {
    action: 'beginCrest',
    from: { crestState: 'missing', alignmentState: 'passed' },
    to: { crestState: 'in_progress' }
  },
  {
    action: 'completeCrest',
    from: { crestState: 'in_progress' },
    to: { crestState: 'created' }
  },
  {
    action: 'initializeHouse',
    from: { houseState: 'missing', crestState: 'created' },
    to: { houseState: 'initializing' }
  },
  {
    action: 'activateHouse',
    from: { houseState: 'initializing' },
    to: { houseState: 'ready' }
  },
  {
    action: 'startFirstMission',
    from: { missionState: 'not_started', houseState: 'ready' },
    to: { missionState: 'active' },
    notes: 'The first mission cannot begin before HQ is real.'
  },
  {
    action: 'completeFirstMission',
    from: { missionState: 'active' },
    to: { missionState: 'completed' }
  },
  {
    action: 'failFirstMission',
    from: { missionState: 'active' },
    to: { missionState: 'failed' }
  },
  {
    action: 'saveFirstMemory',
    from: { missionState: 'completed', memoryState: 'none' },
    to: { memoryState: 'saved' },
    notes: 'Loop completion requires one durable company memory.'
  },
  {
    action: 'revealNextQuest',
    from: { memoryState: 'saved', nextQuestState: 'hidden' },
    to: { nextQuestState: 'visible' }
  }
];

export interface FoundersLoopInvariant {
  key: string;
  description: string;
  holds(state: FoundersLoopState): boolean;
}

export const foundersLoopInvariants: FoundersLoopInvariant[] = [
  {
    key: 'nextQuestRequiresMemory',
    description: 'The next quest cannot be visible until the first memory is saved.',
    holds: (state) => state.nextQuestState !== 'visible' || state.memoryState === 'saved'
  },
  {
    key: 'memoryRequiresCompletedMission',
    description: 'The first memory cannot count as loop completion unless the first mission completed.',
    holds: (state) => state.memoryState !== 'saved' || state.missionState === 'completed'
  },
  {
    key: 'missionRequiresHouse',
    description: 'The first mission cannot be active/completed/failed before HQ is ready.',
    holds: (state) =>
      (state.missionState === 'not_started') || state.houseState === 'ready'
  },
  {
    key: 'houseRequiresCrest',
    description: 'House cannot be ready before the crest is created.',
    holds: (state) => state.houseState !== 'ready' || state.crestState === 'created'
  },
  {
    key: 'crestRequiresAlignment',
    description: 'The crest cannot be created before alignment passes.',
    holds: (state) => state.crestState !== 'created' || state.alignmentState === 'passed'
  },
  {
    key: 'alignmentRequiresFounders',
    description: 'Alignment cannot pass before both founders are registered.',
    holds: (state) =>
      state.alignmentState !== 'passed'
      || (state.humanFounderState === 'registered' && state.agentFounderState === 'registered')
  },
  {
    key: 'agentFounderRequiresBrain',
    description: 'Registered agent founder implies brain/runtime readiness.',
    holds: (state) => state.agentFounderState !== 'registered' || state.brainState === 'ready'
  },
  {
    key: 'completedMissionRequiresAuth',
    description: 'Mission completion cannot happen without authenticated session state.',
    holds: (state) => state.missionState !== 'completed' || state.sessionState === 'authenticated'
  }
];

export function deriveFoundersLoopPhase(state: FoundersLoopState): FoundersLoopPhase {
  if (state.nextQuestState === 'visible') return 'next_quest_visible';
  if (state.memoryState === 'saved') return 'first_memory_saved';
  if (state.missionState === 'completed') return 'first_mission_completed';
  if (state.houseState === 'ready') return 'hq_ready';
  if (state.crestState === 'created') return 'crest_created';
  if (state.alignmentState === 'passed') return 'alignment_passed';
  if (state.humanFounderState === 'registered' && state.agentFounderState === 'registered') return 'founders_established';
  if (state.brainState === 'ready') return 'first_worker_online';
  return 'arrival';
}

export const foundersLoopArtifacts = {
  stateModelDoc: 'docs/founders-loop-state-model.md',
  tlaModule: 'machines/FoundersLoop.tla',
  tlaConfig: 'machines/FoundersLoop.cfg',
  uiProjectionSpec: 'design/specs/10_founders_loop_ui_state_projection.md',
  uiEvidenceSpec: 'design/specs/11_zhc0_ui_evidence_contract.md',
  stateContract: 'specs/43_zhc0_founders_loop_state_contract.md',
  deliveryRoadmap: 'specs/44_zhc0_founders_loop_delivery_roadmap.md'
} as const;
