import { describe, expect, it } from "vitest";

import type { ImportedCsvFile } from "@/integrations/import/import-batch";
import {
  buildLeadPersistenceRows,
  buildSourceRecordRows,
} from "@/integrations/tekion/import/build-csv-persistence-rows";

function csvFile(fileName: string, headers: string[], rows: string[][]): ImportedCsvFile {
  return { sourceKey: fileName, fileName, relativePath: fileName, headers, rows };
}

describe("build CSV persistence rows", () => {
  it("maps Lead ID into the canonical external identity", () => {
    const rows = buildLeadPersistenceRows([
      csvFile(
        "leads.csv",
        [
          "Lead ID", "Contact Name", "Creation Time", "Source",
          "Vehicle Interest", "Source Type (Detailed)", "Lead Source Group",
          "Contact Email Id", "Contact Mobile Phone", "Contact Home Phone",
          "Contact Work Phone", "Year", "Make", "Model", "Status", "Stage",
          "Department", "Dealership", "Deal Status", "Sold Date", "Closed Time",
        ],
        [[
          "LEAD-123", "Ana Yu", "Sep 29 2026 12:00 PM", "OEM",
          "New Vehicle", "Internet", "OEM", "ana@example.com", "555-1111",
          "", "", "2026", "Honda", "CR-V", "Open", "New", "Sales",
          "Example Honda", "Open", "", "",
        ]],
      ),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source_system: "tekion",
      source_type: "lead",
      external_record_id: "LEAD-123",
      contact_name: "Ana Yu",
      vehicle_year: "2026",
      vehicle_make: "Honda",
      vehicle_model: "CR-V",
    });
    expect(rows[0]?.raw_data).toMatchObject({
      row: { "Lead ID": "LEAD-123", "Contact Name": "Ana Yu" },
    });
  });

  it("preserves task rows as source observations", () => {
    const rows = buildSourceRecordRows([
      csvFile(
        "tasks.csv",
        [
          "Task Title", "Due date", "Action", "Associated with",
          "Assignee", "Status", "Created Date", "Created by", "Task Source",
        ],
        [[
          "check-in", "Sep 18 2026 4:00 PM", "Call", "Jeffrey Wilks",
          "Mark Armstrong", "Done", "Sep 18 2026 11:51 AM",
          "Mark Armstrong", "CRM",
        ]],
      ),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.source_system).toBe("tekion");
    expect(rows[0]?.source_type).toBe("task");
    expect(rows[0]?.source_record_id).toMatch(/^[a-f0-9]{64}$/);
    expect(rows[0]?.raw_data).toMatchObject({
      row: {
        "Task Title": "check-in",
        Action: "Call",
        "Associated with": "Jeffrey Wilks",
      },
    });
  });

  it("preserves a lead without an authoritative Lead ID as a source observation", () => {
    const rows = buildSourceRecordRows([
      csvFile(
        "leads.csv",
        ["Lead ID", "Contact Name", "Contact Email Id", "Contact Mobile Phone"],
        [["", "Missing ID", "missing@example.com", "555-9999"]],
      ),
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      source_system: "tekion",
      source_type: "lead",
      source_record_id: "lead:leads.csv:row:2",
    });
    expect(rows[0]?.raw_data).toMatchObject({
      sourceKey: "leads.csv",
      fileName: "leads.csv",
      rowNumber: 2,
      observationStatus: "missing_authoritative_lead_id",
      row: {
        "Lead ID": "",
        "Contact Name": "Missing ID",
        "Contact Email Id": "missing@example.com",
        "Contact Mobile Phone": "555-9999",
      },
    });
  });

  it("does not create a source observation for a lead with an authoritative Lead ID", () => {
    const rows = buildSourceRecordRows([
      csvFile("leads.csv", ["Lead ID", "Contact Name"], [["LEAD-123", "Ana Yu"]]),
    ]);

    expect(rows).toHaveLength(0);
  });
});
