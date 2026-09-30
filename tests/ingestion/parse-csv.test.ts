import { describe, expect, it } from "vitest";
import { parseCsv } from "../../src/integrations/tekion/csv/parse-csv";

describe("parseCsv", () => {
  it("parses CSV headers and rows", () => {
    const csv = `Name,Year,Make
John Smith,2026,Honda
Jane Doe,2025,Toyota`;

    const result = parseCsv(csv);

    expect(result).toEqual([
      {
        Name: "John Smith",
        Year: "2026",
        Make: "Honda",
      },
      {
        Name: "Jane Doe",
        Year: "2025",
        Make: "Toyota",
      },
    ]);
  });

  it("handles quoted commas", () => {
    const csv = `Name,Vehicle
"Smith, John","2026 Honda, CR-V"`;

    const result = parseCsv(csv);

    expect(result[0]).toEqual({
      Name: "Smith, John",
      Vehicle: "2026 Honda, CR-V",
    });
  });
});