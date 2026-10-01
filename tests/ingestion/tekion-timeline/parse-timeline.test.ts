import { describe, expect, it } from "vitest";
import { parseTimeline } from "../../../src/integrations/tekion/timeline/parse-timeline";

describe("parseTimeline", () => {
  it("splits timeline content into events", () => {
    const content = `Email Sent
Salesperson
Sep 28 2026 3:36 PM
customer@example.com
Subject: Test email

Text Received
Customer
Sep 28 2026 3:40 PM
Thanks`;

    const result = parseTimeline(content, "sample.txt");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      rawType: "Email Sent",
      actor: "Salesperson",
      details: expect.stringContaining("Subject: Test email"),
    });
    expect(result[1]).toMatchObject({
      rawType: "Text Received",
      actor: "Customer",
      details: "Thanks",
    });
  });

  it("supports metadata before the actor", () => {
    const content = `Sent Campaign Email
(Automatic)
System
Sep 24 2026 1:14 PM
Subject: Campaign email`;

    const result = parseTimeline(content, "sample.txt");

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      rawType: "Sent Campaign Email",
      actor: "System",
      details: expect.stringContaining("(Automatic)"),
    });
  });

  it("does not treat repeated task titles inside details as new events", () => {
    const content = `Day 5 Internet Lead Tasking - Touch
System
Sep 28 2026 9:04 AM
Day 5 Internet Lead Tasking - Touch
High
Last Monday
Done
Assigned To:
Mark Armstrong

Text Sent
Salesperson
Sep 28 2026 9:10 AM
Hello`;

    const result = parseTimeline(content, "sample.txt");

    expect(result).toHaveLength(2);
    expect(result[0].rawType).toBe("Day 5 Internet Lead Tasking - Touch");
    expect(result[0].details).toContain("Assigned To:");
    expect(result[1].rawType).toBe("Text Sent");
  });
});
