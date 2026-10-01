import { describe, expect, it } from "vitest";
import { importTimelineFile } from "../../../src/integrations/tekion/timeline/import-timeline-file";

describe("importTimelineFile", () => {
  it("parses and normalizes a timeline file", () => {
    const content = `Text Sent
Salesperson
Sep 28 2026 3:36 PM
Hello

Stage Changed
Salesperson
Sep 28 2026 3:40 PM
Stage got changed from Active to Attempted Contact`;

    const result = importTimelineFile(content, "lead-1.txt");

    expect(result.sourceFile).toBe("lead-1.txt");
    expect(result.events).toHaveLength(2);

    expect(result.events[0].category).toBe("communication");
    expect(result.events[1].category).toBe("lifecycle");
  });
});