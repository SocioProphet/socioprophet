---- MODULE AgentplaneDeploy ----
EXTENDS Naturals, Sequences

(*
  Minimal deployment state machine for agentplane pointer safety and replay sufficiency.

  Bundle facts:
    exists[b]      : bundle directory and bundle.json exist
    lane[b]        : "staging" or "prod"
    closed[b]      : validation/run/placement-receipt/replay closure exists
    coherent[b]    : backend + scheduler coherence checks passed
    replayable[b]  : minimum replay tuple exists and is trusted

  Pointer state:
    ptr["current-staging"]
    ptr["current-prod"]
    ptr["previous-good"]
*)

CONSTANTS Bundles, NULL
VARIABLES exists, lane, closed, coherent, replayable, ptr

PointerNames == {"current-staging", "current-prod", "previous-good"}

CanTarget(b) ==
  /\ exists[b]
  /\ closed[b]
  /\ coherent[b]

ReplaySufficient(b) ==
  /\ CanTarget(b)
  /\ replayable[b]

Init ==
  /\ exists \in [Bundles -> BOOLEAN]
  /\ lane \in [Bundles -> {"staging", "prod"}]
  /\ closed \in [Bundles -> BOOLEAN]
  /\ coherent \in [Bundles -> BOOLEAN]
  /\ replayable \in [Bundles -> BOOLEAN]
  /\ ptr = [p \in PointerNames |-> NULL]

RunToStaging(b) ==
  /\ ReplaySufficient(b)
  /\ ptr' = [ptr EXCEPT !["current-staging"] = b]
  /\ UNCHANGED <<exists, lane, closed, coherent, replayable>>

Promote(b) ==
  /\ ReplaySufficient(b)
  /\ lane[b] = "prod"
  /\ ptr' = [ptr EXCEPT
        !["previous-good"] = ptr["current-prod"],
        !["current-prod"] = b]
  /\ UNCHANGED <<exists, lane, closed, coherent, replayable>>

Rollback ==
  /\ ptr["previous-good"] # NULL
  /\ ReplaySufficient(ptr["previous-good"])
  /\ ptr' = [ptr EXCEPT
        !["current-staging"] = ptr["current-prod"],
        !["current-prod"] = ptr["previous-good"]]
  /\ UNCHANGED <<exists, lane, closed, coherent, replayable>>

Next ==
  (\E b \in Bundles:
      RunToStaging(b) \/ Promote(b))
  \/ Rollback

InvPointerTargetsExist ==
  /\ ptr["current-staging"] # NULL => exists[ptr["current-staging"]]
  /\ ptr["current-prod"] # NULL => exists[ptr["current-prod"]]
  /\ ptr["previous-good"] # NULL => exists[ptr["previous-good"]]

InvPointerTargetsClosed ==
  /\ ptr["current-staging"] # NULL => closed[ptr["current-staging"]]
  /\ ptr["current-prod"] # NULL => closed[ptr["current-prod"]]
  /\ ptr["previous-good"] # NULL => closed[ptr["previous-good"]]

InvPointerTargetsCoherent ==
  /\ ptr["current-staging"] # NULL => coherent[ptr["current-staging"]]
  /\ ptr["current-prod"] # NULL => coherent[ptr["current-prod"]]
  /\ ptr["previous-good"] # NULL => coherent[ptr["previous-good"]]

InvReplaySufficient ==
  /\ ptr["current-staging"] # NULL => replayable[ptr["current-staging"]]
  /\ ptr["current-prod"] # NULL => replayable[ptr["current-prod"]]
  /\ ptr["previous-good"] # NULL => replayable[ptr["previous-good"]]

InvProdLane ==
  ptr["current-prod"] # NULL => lane[ptr["current-prod"]] = "prod"

Spec == Init /\ [][Next]_<<exists, lane, closed, coherent, replayable, ptr>>
====
