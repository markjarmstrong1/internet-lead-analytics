import { describe, expect, it } from "vitest";
import {
  buildImportObservations,
} from "../../src/integrations/tekion/import/build-import-observations";
import {
  validateImportObservations,
} from "../../src/integrations/tekion/import/import-validation";

describe("import observations", () => {
  it("builds lead and task observations", () => {
    const result = buildImportObservations({
      leads: [
        {
          record: {
            leadId: "lead-1",
            contactName: "Jane Smith",
            creationTime: "2026-01-01T10:00:00Z",
            source: "Website",
            vehicleInterest: "2026 Ford F-150",
            sourceTypeDetailed: "Website",
            leadSourceGroup: "Internet",
            email: "jane@example.com",
            mobilePhone: "555-111-2222",
            homePhone: "",
            workPhone: "",
            year: "2026",
            make: "Ford",
            model: "F-150",
            status: "Open",
            stage: "New",
            department: "Sales",
            dealership: "Example",
            dealStatus: "",
            soldDate: "",
            closedTime: "",
          },
          rawData: {
            "Lead ID": "lead-1",
          },
        },
      ],
      tasks: [
        {
          record: {
            taskTitle: "Follow up Jane Smith",
            dueDate: "2026-01-02",
            action: "Call",
            associatedWith: "Jane Smith",
            assignee: "Salesperson",
            vehicleOfInterest: "2026 Ford F-150",
            priority: "High",
            status: "Done",
            department: "Sales",
            createdBy: "BDC",
            leadSource: "Website",
            createdDate: "2026-01-01T11:00:00Z",
            year: "2026",
            make: "Ford",
            model: "F-150",
            leadSourceName: "Website",
            manuallyClosedBy: "",
            manuallyClosedTime: "",
            leadStatus: "Open",
            customStage: "New",
            taskSource: "Manual",
            campaignName: "",
            campaignObjective: "",
            leadSourceGroup: "Internet",
            completedBy: "Salesperson",
          },
          rawData: {
            "Task Title": "Follow up Jane Smith",
          },
        },
      ],
    });

    expect(result.leadObservations).toHaveLength(1);
    expect(result.taskObservations).toHaveLength(1);
    expect(result.observations).toHaveLength(2);
  });

  it("allows the same source identity to appear in different imports", () => {
    const observations = [
      {
        sourceSystem: "tekion" as const,
        sourceType: "task" as const,
        sourceRecordId: "task-1",
        rawData: { Status: "Open" },
      },
      {
        sourceSystem: "tekion" as const,
        sourceType: "task" as const,
        sourceRecordId: "task-1",
        rawData: { Status: "Done" },
      },
    ];

    const validation = validateImportObservations(observations);

    expect(validation.valid).toBe(false);
    expect(validation.duplicateObservations).toHaveLength(1);
  });

  it("does not flag different source identities", () => {
    const observations = [
      {
        sourceSystem: "tekion" as const,
        sourceType: "task" as const,
        sourceRecordId: "task-1",
        rawData: { Status: "Open" },
      },
      {
        sourceSystem: "tekion" as const,
        sourceType: "task" as const,
        sourceRecordId: "task-2",
        rawData: { Status: "Done" },
      },
    ];

    const validation = validateImportObservations(observations);

    expect(validation.valid).toBe(true);
    expect(validation.duplicateObservations).toHaveLength(0);
  });
});