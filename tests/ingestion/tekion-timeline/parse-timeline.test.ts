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
      sourceFile: "sample.txt",
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

  it("preserves multiline event details", () => {
    const content = `Note
Salesperson
Sep 28 2026 3:36 PM
First line
Second line
Third line`;

    const result = parseTimeline(content, "sample.txt");

    expect(result[0].details).toBe(
      "First line\nSecond line\nThird line",
    );
  });

  it("ignores text before the first recognized event", () => {
    const content = `Some exported header
Another line

Text Sent
Salesperson
Sep 28 2026 3:36 PM
Hello`;

    const result = parseTimeline(content, "sample.txt");

    expect(result).toHaveLength(1);
    expect(result[0].rawType).toBe("Text Sent");
  });
});