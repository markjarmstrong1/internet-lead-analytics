import { describe, expect, it } from "vitest";
import { sourceEventId } from "../../../src/integrations/tekion/timeline/source-event-id";

describe("sourceEventId", () => {
  const evidence = [
    "lead.txt",
    "Email Sent",
    "2026-09-28T19:36:00.000Z",
    "Salesperson",
    "Subject: Follow up",
  ] as const;

  it("produces a stable identifier for the same evidence", () => {
    expect(sourceEventId(...evidence)).toBe(sourceEventId(...evidence));
  });

  it("changes when source evidence changes", () => {
    const original = sourceEventId(...evidence);
    const changed = sourceEventId(
      evidence[0],
      "Text Sent",
      evidence[2],
      evidence[3],
      evidence[4],
    );

    expect(changed).not.toBe(original);
  });

  it("uses the Tekion source prefix", () => {
    expect(sourceEventId(...evidence)).toMatch(/^tekion:/);
  });
});
