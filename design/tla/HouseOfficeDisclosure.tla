---- MODULE HouseOfficeDisclosure ----
EXTENDS TLC

\* Bounded model for House Office summary-first disclosure.
\* This protects the rule that humans see meaning first and detail second.

CONSTANTS Locales

VARIABLES officeState, topLayer, advancedVisible, rawIdsVisibleTop,
          detailAvailable, helperPrimaryActionCount, assistantAvailable, locale

Vars ==
  << officeState, topLayer, advancedVisible, rawIdsVisibleTop,
     detailAvailable, helperPrimaryActionCount, assistantAvailable, locale >>

TypeInv ==
  /\ officeState \in {"quiet", "needs_attention", "helper_running", "recovery"}
  /\ topLayer \in {"summary"}
  /\ advancedVisible \in BOOLEAN
  /\ rawIdsVisibleTop \in BOOLEAN
  /\ detailAvailable \in BOOLEAN
  /\ helperPrimaryActionCount \in {1}
  /\ assistantAvailable \in BOOLEAN
  /\ locale \in Locales

Init ==
  /\ officeState \in {"quiet", "needs_attention", "helper_running", "recovery"}
  /\ topLayer = "summary"
  /\ advancedVisible = FALSE
  /\ rawIdsVisibleTop = FALSE
  /\ detailAvailable = TRUE
  /\ helperPrimaryActionCount = 1
  /\ assistantAvailable = TRUE
  /\ locale \in Locales

ChangeOfficeState(s) ==
  /\ s \in {"quiet", "needs_attention", "helper_running", "recovery"}
  /\ officeState' = s
  /\ UNCHANGED << topLayer, advancedVisible, rawIdsVisibleTop, detailAvailable,
                  helperPrimaryActionCount, assistantAvailable, locale >>

OpenAdvanced ==
  /\ detailAvailable
  /\ advancedVisible' = TRUE
  /\ UNCHANGED << officeState, topLayer, rawIdsVisibleTop, detailAvailable,
                  helperPrimaryActionCount, assistantAvailable, locale >>

CloseAdvanced ==
  /\ advancedVisible
  /\ advancedVisible' = FALSE
  /\ UNCHANGED << officeState, topLayer, rawIdsVisibleTop, detailAvailable,
                  helperPrimaryActionCount, assistantAvailable, locale >>

RevealRawIds ==
  /\ advancedVisible
  /\ rawIdsVisibleTop' = FALSE
  /\ UNCHANGED << officeState, topLayer, advancedVisible, detailAvailable,
                  helperPrimaryActionCount, assistantAvailable, locale >>

ChangeLocale(l) ==
  /\ l \in Locales
  /\ locale' = l
  /\ UNCHANGED << officeState, topLayer, advancedVisible, rawIdsVisibleTop,
                  detailAvailable, helperPrimaryActionCount, assistantAvailable >>

AssistantLeaves ==
  /\ assistantAvailable
  /\ assistantAvailable' = FALSE
  /\ UNCHANGED << officeState, topLayer, advancedVisible, rawIdsVisibleTop,
                  detailAvailable, helperPrimaryActionCount, locale >>

AssistantReturns ==
  /\ ~assistantAvailable
  /\ assistantAvailable' = TRUE
  /\ UNCHANGED << officeState, topLayer, advancedVisible, rawIdsVisibleTop,
                  detailAvailable, helperPrimaryActionCount, locale >>

Next ==
  \/ \E s \in {"quiet", "needs_attention", "helper_running", "recovery"} : ChangeOfficeState(s)
  \/ OpenAdvanced
  \/ CloseAdvanced
  \/ RevealRawIds
  \/ \E l \in Locales : ChangeLocale(l)
  \/ AssistantLeaves
  \/ AssistantReturns

Spec ==
  Init /\ [][Next]_Vars

SummaryBeforeDetail ==
  topLayer = "summary"

NoRawIdsInTopLayer ==
  ~rawIdsVisibleTop

OneDominantHelperAction ==
  helperPrimaryActionCount = 1

AdvancedDetailRetained ==
  detailAvailable

AssistantCarriesDetail ==
  assistantAvailable => (topLayer = "summary")

====
