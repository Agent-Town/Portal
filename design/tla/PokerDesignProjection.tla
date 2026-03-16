------------------------------- MODULE PokerDesignProjection -------------------------------
EXTENDS Naturals, FiniteSets, Sequences, TLC

\* This model formalizes the poker design logic, not the visual taste.
\* It is intentionally about projection rules:
\* one canonical route state -> simple human projection + advanced human projection + LLM-rich projection.

CONSTANTS Dummy

Routes ==
  {
    "play-lobby",
    "play-schedule",
    "play-table",
    "play-hand-review",
    "play-native-season",
    "play-rail-series",
    "centaur-table"
  }

Roles == {"player", "admin", "rail"}
Locales == {"en", "zh-Hans"}
VoiceModes == {"reserved", "off"}

PrimaryPanel(r) ==
  CASE r = "play-lobby"         -> "quick-seat"
    [] r = "play-schedule"      -> "schedule-day"
    [] r = "play-table"         -> "submit-action"
    [] r = "play-hand-review"   -> "review-summary-shell"
    [] r = "play-native-season" -> "season-leaderboard"
    [] r = "play-rail-series"   -> "rail-series-summary"
    [] r = "centaur-table"      -> "centaur-submit-action"

SimplePanels(r) ==
  CASE r = "play-lobby" ->
        {"quick-seat", "live-tables", "tournament-series", "eligibility", "poker-policy"}
    [] r = "play-schedule" ->
        {"schedule-snapshot", "schedule-day", "recurring-templates"}
    [] r = "play-table" ->
        {"table-summary", "current-hand", "submit-action", "your-seat", "seat-thread"}
    [] r = "play-hand-review" ->
        {"review-summary-shell", "review-result-summary", "review-action-line", "review-board-pot"}
    [] r = "play-native-season" ->
        {"season-summary", "season-leaderboard", "season-economy"}
    [] r = "play-rail-series" ->
        {"rail-series-summary", "rail-series-tables", "rail-series-payouts"}
    [] r = "centaur-table" ->
        {"centaur-summary", "centaur-live-hand", "centaur-submit-action", "centaur-discussion"}

AdvancedPanels(r) ==
  CASE r = "play-lobby" ->
        {"eligibility-detail", "poker-policy-detail", "live-table-detail", "series-detail"}
    [] r = "play-schedule" ->
        {"schedule-snapshot-detail", "recurring-templates-detail", "schedule-admin-detail", "schedule-event-detail"}
    [] r = "play-table" ->
        {"seat-thread-detail", "study-preview", "table-review", "operator-review", "worker-seat-agent", "auto-act"}
    [] r = "play-hand-review" ->
        {"review-human-note", "review-agent-note", "review-lesson-tags", "review-notebook", "review-opponent-notes"}
    [] r = "play-native-season" ->
        {"season-economy-detail"}
    [] r = "play-rail-series" ->
        {"rail-series-detail"}
    [] r = "centaur-table" ->
        {"centaur-snapshot-hour", "centaur-verify-detail"}

AdminPanels(r) ==
  CASE r = "play-schedule" -> {"schedule-admin"}
    [] r = "play-table"    -> {"operator-review-shell", "series-director"}
    [] OTHER               -> {}

OrderedRoutes == {"play-lobby", "play-schedule"}

OrderedPanels(r) ==
  CASE r = "play-lobby"    -> <<"quick-seat", "live-tables", "tournament-series", "eligibility", "poker-policy">>
    [] r = "play-schedule" -> <<"schedule-snapshot", "schedule-day", "recurring-templates", "schedule-admin", "schedule-empty">>

DominantPanels(r) ==
  CASE r = "play-lobby"    -> {"quick-seat", "live-tables"}
    [] r = "play-schedule" -> {"schedule-snapshot", "schedule-day"}

DeferredPanels(r) ==
  CASE r = "play-lobby"    -> {"eligibility", "poker-policy"}
    [] r = "play-schedule" -> {"recurring-templates", "schedule-admin", "schedule-empty"}

CanonicalFacts(r) ==
  CASE r = "play-lobby" ->
        {"house", "wallet", "oilBalance", "tableCount", "seriesCount", "policyLimits", "policySelfExclusion", "tableHistory", "seriesPayout", "seriesDirectorPlan"}
    [] r = "play-schedule" ->
        {"house", "wallet", "templateCount", "eventCount", "registeredCount", "waitlistedCount", "recurringTemplates", "adminTemplates", "eventWaitlist", "eventBreaks", "eventTimeline"}
    [] r = "play-table" ->
        {"handState", "actionState", "seatState", "threadState", "studyState", "operatorState", "agentState"}
    [] r = "play-hand-review" ->
        {"result", "actionLine", "boardState", "humanNotes", "agentNotes", "opponentNotes", "tags"}
    [] r = "play-native-season" ->
        {"leaderboard", "seasonSummary", "seasonEconomy"}
    [] r = "play-rail-series" ->
        {"seriesSummary", "seriesTables", "seriesPayouts"}
    [] r = "centaur-table" ->
        {"centaurSummary", "centaurHand", "centaurDiscussion", "centaurVerify", "centaurSnapshots"}

SimpleProjectionFacts(r) ==
  CASE r = "play-lobby"         -> {"oilBalance", "tableCount", "seriesCount", "policyLimits"}
    [] r = "play-schedule"      -> {"eventCount", "registeredCount", "waitlistedCount"}
    [] r = "play-table"         -> {"handState", "actionState", "seatState"}
    [] r = "play-hand-review"   -> {"result", "actionLine", "boardState"}
    [] r = "play-native-season" -> {"leaderboard", "seasonSummary"}
    [] r = "play-rail-series"   -> {"seriesSummary", "seriesTables"}
    [] r = "centaur-table"      -> {"centaurSummary", "centaurHand", "centaurDiscussion"}

AdvancedProjectionFacts(r) ==
  CASE r = "play-lobby" ->
        {"oilBalance", "tableCount", "seriesCount", "policyLimits", "house", "wallet", "policySelfExclusion", "tableHistory", "seriesPayout", "seriesDirectorPlan"}
    [] r = "play-schedule" ->
        {"eventCount", "registeredCount", "waitlistedCount", "house", "wallet", "templateCount", "recurringTemplates", "adminTemplates", "eventWaitlist", "eventBreaks", "eventTimeline"}
    [] r = "play-table" ->
        {"handState", "actionState", "seatState", "threadState", "studyState", "operatorState", "agentState"}
    [] r = "play-hand-review" ->
        {"result", "actionLine", "boardState", "humanNotes", "agentNotes", "opponentNotes", "tags"}
    [] r = "play-native-season" ->
        {"leaderboard", "seasonSummary", "seasonEconomy"}
    [] r = "play-rail-series" ->
        {"seriesSummary", "seriesTables", "seriesPayouts"}
    [] r = "centaur-table" ->
        {"centaurSummary", "centaurHand", "centaurDiscussion", "centaurVerify", "centaurSnapshots"}

LLMProjectionFacts(r) == CanonicalFacts(r)

AllAdvancedPanels == UNION {AdvancedPanels(r) : r \in Routes}

VARIABLES route, role, locale, voiceMode, openedDetails

VisiblePanelsFor(r, rl, loc, vm, od) ==
  LET base == SimplePanels(r)
      gatedAdmin == IF rl = "admin" THEN AdminPanels(r) ELSE {}
      gatedAdvanced == od \cap AdvancedPanels(r)
  IN base \cup gatedAdmin \cup gatedAdvanced

IndexOf(seq, item) == CHOOSE i \in 1..Len(seq) : seq[i] = item

Init ==
  /\ route = "play-lobby"
  /\ role = "player"
  /\ locale = "en"
  /\ voiceMode = "reserved"
  /\ openedDetails = {}

SwitchRoute(r) ==
  /\ r \in Routes
  /\ route' = r
  /\ openedDetails' = {}
  /\ UNCHANGED <<role, locale, voiceMode>>

SwitchRole(rl) ==
  /\ rl \in Roles
  /\ role' = rl
  /\ openedDetails' = openedDetails \cap AdvancedPanels(route)
  /\ UNCHANGED <<route, locale, voiceMode>>

SwitchLocale(loc) ==
  /\ loc \in Locales
  /\ locale' = loc
  /\ UNCHANGED <<route, role, voiceMode, openedDetails>>

SwitchVoice(vm) ==
  /\ vm \in VoiceModes
  /\ voiceMode' = vm
  /\ UNCHANGED <<route, role, locale, openedDetails>>

OpenDetail(d) ==
  /\ d \in AdvancedPanels(route)
  /\ openedDetails' = openedDetails \cup {d}
  /\ UNCHANGED <<route, role, locale, voiceMode>>

CloseDetail(d) ==
  /\ d \in openedDetails
  /\ openedDetails' = openedDetails \ {d}
  /\ UNCHANGED <<route, role, locale, voiceMode>>

Next ==
  \/ \E r \in Routes : SwitchRoute(r)
  \/ \E rl \in Roles : SwitchRole(rl)
  \/ \E loc \in Locales : SwitchLocale(loc)
  \/ \E vm \in VoiceModes : SwitchVoice(vm)
  \/ \E d \in AdvancedPanels(route) : OpenDetail(d)
  \/ \E d \in openedDetails : CloseDetail(d)

TypeOK ==
  /\ route \in Routes
  /\ role \in Roles
  /\ locale \in Locales
  /\ voiceMode \in VoiceModes
  /\ openedDetails \subseteq AdvancedPanels(route)

PrimaryVisible ==
  PrimaryPanel(route) \in VisiblePanelsFor(route, role, locale, voiceMode, openedDetails)

DominantBeforeDeferred ==
  \A r \in OrderedRoutes :
    \A lead \in DominantPanels(r) :
      \A deferred \in DeferredPanels(r) :
        IndexOf(OrderedPanels(r), lead) < IndexOf(OrderedPanels(r), deferred)

NoAmbientAdvancedByDefault ==
  VisiblePanelsFor(route, role, locale, voiceMode, {}) \cap AdvancedPanels(route) = {}

AdvancedPanelsRequireExplicitOpen ==
  \A d \in AdvancedPanels(route) :
    (d \in VisiblePanelsFor(route, role, locale, voiceMode, openedDetails)) <=> (d \in openedDetails)

AdminPanelsGated ==
  role # "admin" =>
    AdminPanels(route) \cap VisiblePanelsFor(route, role, locale, voiceMode, openedDetails) = {}

LocaleDoesNotChangeVisibility ==
  \A loc \in Locales :
    VisiblePanelsFor(route, role, loc, voiceMode, openedDetails)
      = VisiblePanelsFor(route, role, locale, voiceMode, openedDetails)

VoiceModeDoesNotChangeVisibility ==
  \A vm \in VoiceModes :
    VisiblePanelsFor(route, role, locale, vm, openedDetails)
      = VisiblePanelsFor(route, role, locale, voiceMode, openedDetails)

ProjectionFactSubset ==
  /\ SimpleProjectionFacts(route) \subseteq AdvancedProjectionFacts(route)
  /\ AdvancedProjectionFacts(route) \subseteq LLMProjectionFacts(route)
  /\ LLMProjectionFacts(route) = CanonicalFacts(route)

NoProjectionDrift ==
  /\ SimpleProjectionFacts(route) \subseteq CanonicalFacts(route)
  /\ AdvancedProjectionFacts(route) \subseteq CanonicalFacts(route)
  /\ LLMProjectionFacts(route) \subseteq CanonicalFacts(route)

Spec == Init /\ [][Next]_<<route, role, locale, voiceMode, openedDetails>>

=============================================================================
