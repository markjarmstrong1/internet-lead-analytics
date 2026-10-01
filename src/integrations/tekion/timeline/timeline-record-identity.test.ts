import { describe, expect, it } from "vitest";
import { getTimelineRecordIdentity } from "./timeline-record-identity";

describe("getTimelineRecordIdentity", () => {
  it("prefers the real external record id", () => {
    expect(
      getTimelineRecordIdentity({
        sourceSystem: "tekion",
        sourceType: "timeline",
        externalRecordId: "abc-123",
        fixtureSourceKey: "ana_yu.txt",
      }),
    ).toBe("tekion:timeline:external:abc-123");
  });

  it("uses the fixture source key when no API id exists", () => {
    expect(
      getTimelineRecordIdentity({
        sourceSystem: "tekion",
        sourceType: "timeline",
        fixtureSourceKey: "fixtures/ana_yu.txt",
      }),
    ).toBe("tekion:timeline:fixture:fixtures/ana_yu.txt");
  });

  it("does not use a filename without an explicit source key", () => {
    expect(
      getTimelineRecordIdentity({
        sourceSystem: "tekion",
        sourceType: "timeline",
      }),
    ).toBeNull();
  });

  it("trims identity values", () => {
    expect(
      getTimelineRecordIdentity({
        sourceSystem: "tekion",
        sourceType: "timeline",
        externalRecordId: "  abc-123  ",
      }),
    ).toBe("tekion:timeline:external:abc-123");
  });
});
