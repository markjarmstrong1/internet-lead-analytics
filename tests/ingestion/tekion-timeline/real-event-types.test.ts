import { describe, expect, it } from "vitest";
import { parseTimeline } from "../../../src/integrations/tekion/timeline/parse-timeline";
import { normalizeTimelineEvent } from "../../../src/integrations/tekion/timeline/normalize-timeline-event";

describe("real Tekion event types", () => {
  it("recognizes observed task and lifecycle boundaries", () => {
    const content = `Lead Created
System
Sep 20 2026 9:00 AM
Created

New Internet Lead - Immediate Follow Up Call
System
Sep 20 2026 9:03 AM
High
Done

Day 5 Internet Lead Tasking - Touch
System
Sep 25 2026 9:03 AM
High
Done`;

    const result = parseTimeline(content, "sample.txt");

    expect(result.map((event) => event.rawType)).toEqual([
      "Lead Created",
      "New Internet Lead - Immediate Follow Up Call",
      "Day 5 Internet Lead Tasking - Touch",
    ]);
  });

  it("recognizes observed communication and deal boundaries", () => {
    const content = `Missed Call
System
Sep 20 2026 10:00 AM
Missed

Call Attempt
System
Sep 20 2026 10:01 AM
Attempted

Deal Updated
System
Sep 20 2026 10:02 AM
Updated`;

    const result = parseTimeline(content, "sample.txt");

    expect(result.map((event) => event.rawType)).toEqual([
      "Missed Call",
      "Call Attempt",
      "Deal Updated",
    ]);

    expect(normalizeTimelineEvent(result[0]).category).toBe("communication");
    expect(normalizeTimelineEvent(result[1]).category).toBe("communication");
    expect(normalizeTimelineEvent(result[2]).category).toBe("deal");
  });

  it("recognizes automated campaign email events", () => {
    const content = `Sent Campaign Email
(Automatic)
System
Sep 20 2026 1:14 PM
Campaign email`;

    const result = parseTimeline(content, "sample.txt");

    expect(result).toHaveLength(1);
    expect(result[0].rawType).toBe("Sent Campaign Email");
    expect(normalizeTimelineEvent(result[0]).category).toBe("automation");
  });
});
