import { describe, expect, it } from "vitest";
import { getMetricDefinition, listMetricDefinitions } from "./metric-definition";

describe("MANTIK V0 metric definitions", () => {
  it("defines response rate with an explicit numerator, denominator, and limitations", () => {
    const definition = getMetricDefinition("response-rate");
    expect(definition).not.toBeNull();
    expect(definition?.numeratorLabel).toContain("inbound response");
    expect(definition?.denominatorLabel).toContain("outbound communication");
    expect(definition?.limitations.some((item) => item.toLowerCase().includes("caus"))).toBe(true);
  });

  it("does not invent definitions for unknown metrics", () => {
    expect(getMetricDefinition("made-up-metric")).toBeNull();
    expect(listMetricDefinitions().map((item) => item.id)).toEqual(["response-rate"]);
  });
});
