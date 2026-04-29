#!/usr/bin/env python3
from __future__ import annotations

BUNDLES = ("A", "B")

base_exists = {"A": True, "B": True}
base_lane = {"A": "staging", "B": "prod"}
base_closed = {"A": True, "B": True}
base_coherent = {"A": True, "B": True}
base_replayable = {"A": True, "B": True}


def can_target(b, exists, closed, coherent):
    return exists[b] and closed[b] and coherent[b]


def replay_sufficient(b, exists, closed, coherent, replayable):
    return can_target(b, exists, closed, coherent) and replayable[b]


def inv(state):
    exists, lane, closed, coherent, replayable, ptr = state
    for p in ("current-staging", "current-prod", "previous-good"):
        b = ptr[p]
        if b is not None:
            assert exists[b], f"{p} points to non-existent bundle"
            assert closed[b], f"{p} points to non-closed bundle"
            assert coherent[b], f"{p} points to incoherent bundle"
            assert replayable[b], f"{p} points to non-replayable bundle"
    if ptr["current-prod"] is not None:
        assert lane[ptr["current-prod"]] == "prod", "current-prod must point to prod-lane bundle"


def next_states(state):
    exists, lane, closed, coherent, replayable, ptr = state
    out = []
    for b in BUNDLES:
        if replay_sufficient(b, exists, closed, coherent, replayable):
            n = dict(ptr)
            n["current-staging"] = b
            out.append((exists, lane, closed, coherent, replayable, n))
            if lane[b] == "prod":
                n = dict(ptr)
                n["previous-good"] = ptr["current-prod"]
                n["current-prod"] = b
                out.append((exists, lane, closed, coherent, replayable, n))
    if ptr["previous-good"] is not None and replay_sufficient(ptr["previous-good"], exists, closed, coherent, replayable):
        n = dict(ptr)
        n["current-staging"] = ptr["current-prod"]
        n["current-prod"] = ptr["previous-good"]
        out.append((exists, lane, closed, coherent, replayable, n))
    return out


def explore():
    init_ptr = {"current-staging": None, "current-prod": None, "previous-good": None}
    init = (base_exists, base_lane, base_closed, base_coherent, base_replayable, init_ptr)
    seen = set()
    frontier = [init]

    def freeze(state):
        exists, lane, closed, coherent, replayable, ptr = state
        return (
            tuple(sorted(exists.items())),
            tuple(sorted(lane.items())),
            tuple(sorted(closed.items())),
            tuple(sorted(coherent.items())),
            tuple(sorted(replayable.items())),
            tuple(sorted(ptr.items())),
        )

    steps = 0
    while frontier:
        s = frontier.pop()
        fs = freeze(s)
        if fs in seen:
            continue
        seen.add(fs)
        inv(s)
        steps += 1
        frontier.extend(next_states(s))
    print({"status": "PASS", "states_explored": steps})


if __name__ == "__main__":
    explore()
