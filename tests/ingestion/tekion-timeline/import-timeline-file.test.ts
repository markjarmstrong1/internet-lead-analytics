import { describe, expect, it } from "vitest";
import { importTimelineFile } from "../../../src/integrations/tekion/timeline/import-timeline-file";

describe("importTimelineFile", () => {
  it("returns normalized communication semantics", () => {
    const content = [
      "Email Sent",
      "Salesperson",
      "Sep 28 2026 3:36 PM",
      "Subject: Follow up",
    ].join("\n");

    const result = importTimelineFile(content, "sample.txt");

    expect(result.sourceFile).toBe("sample.txt");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].category).toBe("communication");
    expect(result.events[0].communicationChannel).toBe("email");
    expect(result.events[0].communicationDirection).toBe("outbound");
  });
});
