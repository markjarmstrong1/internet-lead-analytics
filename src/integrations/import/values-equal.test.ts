import { describe, expect, it } from "vitest";

import {
  areIsoTimestampsEqual,
  areJsonValuesEqual,
} from "./values-equal";

describe("areIsoTimestampsEqual", () => {
  it("treats equivalent timestamp representations as equal", () => {
    expect(
      areIsoTimestampsEqual(
        "2026-09-23T04:00:00.000Z",
        "2026-09-23 04:00:00+00",
      ),
    ).toBe(true);
  });

  it("detects different instants", () => {
    expect(
      areIsoTimestampsEqual(
        "2026-09-23T04:00:00.000Z",
        "2026-09-23T04:00:01.000Z",
      ),
    ).toBe(false);
  });

  it("falls back to exact comparison for invalid timestamps", () => {
    expect(
      areIsoTimestampsEqual("not-a-date", "not-a-date"),
    ).toBe(true);

    expect(
      areIsoTimestampsEqual("not-a-date", "different"),
    ).toBe(false);
  });
});

describe("areJsonValuesEqual", () => {
  it("ignores object key order", () => {
    expect(
      areJsonValuesEqual(
        { first: 1, second: 2 },
        { second: 2, first: 1 },
      ),
    ).toBe(true);
  });

  it("compares nested objects structurally", () => {
    expect(
      areJsonValuesEqual(
        {
          source: {
            actor: "System",
            details: "Done",
          },
        },
        {
          source: {
            details: "Done",
            actor: "System",
          },
        },
      ),
    ).toBe(true);
  });

  it("preserves array ordering", () => {
    expect(
      areJsonValuesEqual([1, 2], [2, 1]),
    ).toBe(false);
  });

  it("detects actual value differences", () => {
    expect(
      areJsonValuesEqual(
        { actor: "System" },
        { actor: "Mark Armstrong" },
      ),
    ).toBe(false);
  });
});
