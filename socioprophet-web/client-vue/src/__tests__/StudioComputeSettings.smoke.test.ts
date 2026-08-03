import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { flushPromises } from "@vue/test-utils";
import StudioComputeSettings from "../pages/studio/StudioComputeSettings.vue";

describe("StudioComputeSettings", () => {
  it("renders the governed-deployment view + both planes from the stub", async () => {
    const w = mount(StudioComputeSettings, { props: { project: "test-project" } });
    await flushPromises();
    const text = w.text();
    // both planes
    expect(text).toContain("Governed plane");
    expect(text).toContain("Mesh plane");
    // mesh rides the inception-twin and is revocable
    expect(text).toContain("inception-twin");
    // the governed-deployment columns (image 5)
    expect(text).toContain("Data class");
    expect(text).toContain("Legal basis");
    expect(text).toContain("Attestation");
    // a real deployment row
    expect(text).toContain("FraudDetector-v2");
  });
});
