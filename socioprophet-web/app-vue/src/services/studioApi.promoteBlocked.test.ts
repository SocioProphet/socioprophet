// The promote-response discriminator (StudioGovernance HDT + Worldsignal paths).
//
// Guards the fix for the finding: the previous `"blocked" in r` check treated
// `{ blocked: false }` as a rejection because `in` tests for presence, not
// value. `isPromoteBlocked` uses `blocked === true`, so a success shape that
// ever emits `blocked: false` is correctly classified as OK.
import { describe, expect, it } from "vitest";
import { isPromoteBlocked } from "./studioApi";

describe("isPromoteBlocked — promoteHdt / promoteWorldsignal discriminator", () => {
  it("classifies { blocked: true, message } as a rejection", () => {
    expect(isPromoteBlocked({ blocked: true, message: "invariant" })).toBe(true);
  });

  it("classifies { blocked: false } as NOT a rejection — this is the fix", () => {
    // The old `"blocked" in r` check misclassified this as blocked.
    expect(isPromoteBlocked({ blocked: false })).toBe(false);
  });

  it("classifies a plain success { to_state, epistemic_mode, canonical } as NOT a rejection", () => {
    expect(
      isPromoteBlocked({ to_state: "Promoted", epistemic_mode: "attested", canonical: true }),
    ).toBe(false);
  });
});
