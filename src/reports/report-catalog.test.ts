import { describe, expect, it } from "vitest";

import {
  REPORT_DIMENSIONS,
  REPORT_MEASURES,
  dimensionDefinition,
  measureDefinition,
} from "./report-catalog";

describe("report catalog", () => {
  it("defines dimensions as first-class report concepts", () => {
    expect(REPORT_DIMENSIONS).toHaveLength(6);

    expect(
      dimensionDefinition("responseSpeed"),
    ).toMatchObject({
      key: "responseSpeed",
      label: "Response speed",
      description: expect.any(String),
    });
  });

  it("defines measures as first-class report concepts", () => {
    expect(REPORT_MEASURES).toHaveLength(12);

    expect(
      measureDefinition("responseRate"),
    ).toMatchObject({
      key: "responseRate",
      format: "percent",
      description: expect.any(String),
    });

    expect(
      measureDefinition("medianResponseMinutes"),
    ).toMatchObject({
      key: "medianResponseMinutes",
      format: "minutes",
      description: expect.any(String),
    });
  });

  it("keeps the legacy metric catalog alias compatible", async () => {
    const { REPORT_METRICS } = await import("./report-catalog");

    expect(REPORT_METRICS).toBe(REPORT_MEASURES);
  });
});
