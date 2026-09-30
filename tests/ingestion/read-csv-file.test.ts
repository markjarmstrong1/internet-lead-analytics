import { describe, expect, it } from "vitest";
import { writeFile } from "node:fs/promises";
import { readCsvFile } from "../../src/integrations/tekion/csv/read-csv-file";

describe("readCsvFile", () => {
  it("reads a CSV file as text", async () => {
    const filePath = "/tmp/internet-lead-analytics-test.csv";
    const content = "Name,Year\nTest Person,2026";

    await writeFile(filePath, content, "utf8");

    const result = await readCsvFile(filePath);

    expect(result).toBe(content);
  });
});