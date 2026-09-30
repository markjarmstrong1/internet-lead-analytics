import { describe, expect, it } from "vitest";
import { mapLeadRow } from "../../src/integrations/tekion/csv/map-lead-row";
import { mapTaskRow } from "../../src/integrations/tekion/csv/map-task-row";

describe("mapLeadRow", () => {
  it("maps Tekion lead columns", () => {
    const result = mapLeadRow({
      "Lead ID": "lead-123",
      "Contact Name": "Test Person",
      "Creation Time": "2026-09-17",
      Source: "TrueCar",
      "Vehicle Interest": "2026 Honda CR-V",
      "Source Type (Detailed)": "Internet",
      "Lead Source Group": "TrueCar",
      "Contact Email Id": "test@example.com",
      "Contact Mobile Phone": "555-0000",
      Year: "2026",
      Make: "Honda",
      Model: "CR-V",
      Status: "Active",
      Stage: "Proposal",
      Department: "Sales",
      Dealership: "Test Dealer",
      "Deal Status": "Quote",
      "Sold Date": "",
      "Closed Time": "",
    });

    expect(result.leadId).toBe("lead-123");
    expect(result.contactName).toBe("Test Person");
    expect(result.source).toBe("TrueCar");
    expect(result.year).toBe("2026");
    expect(result.make).toBe("Honda");
    expect(result.model).toBe("CR-V");
  });
});

describe("mapTaskRow", () => {
  it("maps Tekion task columns", () => {
    const result = mapTaskRow({
      "Task Title": "check-in",
      "Due date": "2026-09-18",
      Action: "Call",
      "Associated with": "Test Person",
      Assignee: "Test User",
      "Vehicle of Interest": "2026 Honda CR-V",
      Status: "Done",
      Department: "Sales",
      "Created by": "Test User",
      "Lead Source": "OEM",
      "Created Date": "2026-09-18",
      Year: "2026",
      Make: "Honda",
      Model: "CR-V",
      "Lead Source Name": "ThirdParty Honda",
      "Manually Closed By": "",
      "Manually Closed Time": "",
      "Lead Status": "Active",
      "Custom Stage": "",
      "Task Source": "CRM",
      "Campaign Name": "",
      "Campaign Objective": "",
      "Lead Source Group": "",
      "Completed By": "",
    });

    expect(result.taskTitle).toBe("check-in");
    expect(result.action).toBe("Call");
    expect(result.status).toBe("Done");
    expect(result.year).toBe("2026");
    expect(result.make).toBe("Honda");
    expect(result.model).toBe("CR-V");
    expect(result.leadSourceName).toBe("ThirdParty Honda");
  });
});