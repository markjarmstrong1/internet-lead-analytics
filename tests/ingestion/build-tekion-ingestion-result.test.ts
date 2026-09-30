import { describe, expect, it } from "vitest";
import { buildTekionIngestionResult } from "../../src/integrations/tekion/import/build-tekion-ingestion-result";

describe("buildTekionIngestionResult", () => {
  it("builds normalized records, preserves source rows, and matches tasks", () => {
    const leadRows = [
      {
        "Lead ID": "lead-1",
        "Contact Name": "John Smith",
        "Creation Time": "2026-09-17T10:00:00Z",
        Source: "OEM",
        "Vehicle Interest": "2026 Honda CR-V",
        "Source Type (Detailed)": "Internet",
        "Lead Source Group": "Internet",
        "Contact Email Id": "john@example.com",
        "Contact Mobile Phone": "555-1111",
        "Contact Home Phone": "",
        "Contact Work Phone": "",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        Status: "Active",
        Stage: "Engage",
        Department: "Sales",
        Dealership: "Test Dealer",
        "Deal Status": "",
        "Sold Date": "",
        "Closed Time": "",
      },
    ];

    const taskRows = [
      {
        "Task Title": "check-in",
        "Due date": "2026-09-18",
        Action: "Call",
        "Associated with": "John Smith",
        Assignee: "Salesperson",
        "Vehicle of Interest": "2026 Honda CR-V",
        Status: "Done",
        Department: "Sales",
        "Created by": "Salesperson",
        "Lead Source": "OEM",
        "Created Date": "2026-09-17T10:05:00Z",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        "Lead Source Name": "",
        "Manually Closed By": "",
        "Manually Closed Time": "",
        "Lead Status": "Active",
        "Custom Stage": "",
        "Task Source": "CRM",
        "Campaign Name": "",
        "Campaign Objective": "",
        "Lead Source Group": "Internet",
        "Completed By": "Salesperson",
      },
    ];

    const result = buildTekionIngestionResult(
      leadRows,
      taskRows,
    );

    expect(result.summary).toEqual({
      leadCount: 1,
      taskCount: 1,
      matchedTaskCount: 1,
      ambiguousTaskCount: 0,
      unmatchedTaskCount: 0,
    });

    expect(result.leads).toHaveLength(1);
    expect(result.leads[0].leadId).toBe("lead-1");

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].taskTitle).toBe("check-in");

    expect(result.leadSourceRecords).toHaveLength(1);
    expect(
      result.leadSourceRecords[0].sourceRecordId,
    ).toBe("lead-1");

    expect(
      result.leadSourceRecords[0].rawData["Lead ID"],
    ).toBe("lead-1");

    expect(result.taskSourceRecords).toHaveLength(1);
    expect(
      result.taskSourceRecords[0].sourceType,
    ).toBe("task");

    expect(result.taskMatches).toHaveLength(1);
    expect(result.taskMatches[0].status).toBe("matched");
    expect(result.taskMatches[0].leadId).toBe("lead-1");
    expect(result.taskMatches[0].features).toEqual([
      "year",
      "make",
      "model",
      "lead_source",
      "lead_source_group",
    ]);
  });

  it("preserves an unmatched task instead of guessing", () => {
    const leadRows = [
      {
        "Lead ID": "lead-1",
        "Contact Name": "John Smith",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        Source: "OEM",
        "Lead Source Group": "Internet",
        "Vehicle Interest": "",
        "Creation Time": "",
        "Source Type (Detailed)": "",
        "Contact Email Id": "",
        "Contact Mobile Phone": "",
        "Contact Home Phone": "",
        "Contact Work Phone": "",
        Status: "",
        Stage: "",
        Department: "",
        Dealership: "",
        "Deal Status": "",
        "Sold Date": "",
        "Closed Time": "",
      },
    ];

    const taskRows = [
      {
        "Task Title": "check-in",
        "Due date": "",
        Action: "Call",
        "Associated with": "Someone Else",
        Assignee: "",
        "Vehicle of Interest": "",
        Status: "Done",
        Department: "Sales",
        "Created by": "",
        "Lead Source": "OEM",
        "Created Date": "2026-09-17T10:05:00Z",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        "Lead Source Name": "",
        "Manually Closed By": "",
        "Manually Closed Time": "",
        "Lead Status": "",
        "Custom Stage": "",
        "Task Source": "CRM",
        "Campaign Name": "",
        "Campaign Objective": "",
        "Lead Source Group": "Internet",
        "Completed By": "",
      },
    ];

    const result = buildTekionIngestionResult(
      leadRows,
      taskRows,
    );

    expect(result.summary).toEqual({
      leadCount: 1,
      taskCount: 1,
      matchedTaskCount: 0,
      ambiguousTaskCount: 0,
      unmatchedTaskCount: 1,
    });

    expect(result.taskMatches[0]).toMatchObject({
      status: "unmatched",
      features: [],
      candidateLeadIds: [],
    });

    expect(result.taskSourceRecords).toHaveLength(1);
    expect(
      result.taskSourceRecords[0].rawData["Associated with"],
    ).toBe("Someone Else");
  });

  it("preserves ambiguity instead of selecting a lead", () => {
    const leadRows = [
      {
        "Lead ID": "lead-1",
        "Contact Name": "John Smith",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        Source: "OEM",
        "Lead Source Group": "Internet",
        "Vehicle Interest": "",
        "Creation Time": "",
        "Source Type (Detailed)": "",
        "Contact Email Id": "",
        "Contact Mobile Phone": "",
        "Contact Home Phone": "",
        "Contact Work Phone": "",
        Status: "",
        Stage: "",
        Department: "",
        Dealership: "",
        "Deal Status": "",
        "Sold Date": "",
        "Closed Time": "",
      },
      {
        "Lead ID": "lead-2",
        "Contact Name": "John Smith",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        Source: "OEM",
        "Lead Source Group": "Internet",
        "Vehicle Interest": "",
        "Creation Time": "",
        "Source Type (Detailed)": "",
        "Contact Email Id": "",
        "Contact Mobile Phone": "",
        "Contact Home Phone": "",
        "Contact Work Phone": "",
        Status: "",
        Stage: "",
        Department: "",
        Dealership: "",
        "Deal Status": "",
        "Sold Date": "",
        "Closed Time": "",
      },
    ];

    const taskRows = [
      {
        "Task Title": "check-in",
        "Due date": "",
        Action: "Call",
        "Associated with": "John Smith",
        Assignee: "",
        "Vehicle of Interest": "",
        Status: "Done",
        Department: "Sales",
        "Created by": "",
        "Lead Source": "OEM",
        "Created Date": "2026-09-17T10:05:00Z",
        Year: "2026",
        Make: "Honda",
        Model: "CR-V",
        "Lead Source Name": "",
        "Manually Closed By": "",
        "Manually Closed Time": "",
        "Lead Status": "",
        "Custom Stage": "",
        "Task Source": "CRM",
        "Campaign Name": "",
        "Campaign Objective": "",
        "Lead Source Group": "Internet",
        "Completed By": "",
      },
    ];

    const result = buildTekionIngestionResult(
      leadRows,
      taskRows,
    );

    expect(result.taskMatches[0]).toMatchObject({
      status: "ambiguous",
      leadId: undefined,
      features: [],
      candidateLeadIds: ["lead-1", "lead-2"],
    });

    expect(result.summary.ambiguousTaskCount).toBe(1);
    expect(result.summary.matchedTaskCount).toBe(0);
  });
});