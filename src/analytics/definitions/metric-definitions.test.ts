import { describe, expect, it } from "vitest";
import {
  ANALYTICS_METRIC_DEFINITIONS,
  getMetricDefinition,
} from "./metric-definitions";

describe("canonical analytics metric definitions", () => {
  it("contains one authoritative definition for every metric", () => {
    const keys = ANALYTICS_METRIC_DEFINITIONS.map(
      (definition) => definition.key,
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain("contacted");
    expect(keys).toContain("observedOutbound");
    expect(keys).toContain("responded");
    expect(keys).toContain("soldClosed");
  });

  it("keeps CRM contact distinct from observed outbound", () => {
    expect(getMetricDefinition("contacted").dateBasis).toBe(
      "first_contacted",
    );

    expect(getMetricDefinition("observedOutbound").dateBasis).toBe(
      "first_outbound",
    );
  });

  it("documents evidence limitations", () => {
    expect(
      getMetricDefinition("responseRate").limitations.length,
    ).toBeGreaterThan(0);

    expect(
      getMetricDefinition("soldClosed").limitations.length,
    ).toBeGreaterThan(0);
  });
});
