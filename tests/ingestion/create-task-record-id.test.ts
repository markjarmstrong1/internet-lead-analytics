import { describe, expect, it } from "vitest";
import { createTaskRecordId } from "../../src/integrations/tekion/import/create-task-record-id";
import type { TekionTaskRecord } from "../../src/integrations/tekion/csv/task-record";

const task: TekionTaskRecord = {
  taskTitle: "check-in",
  dueDate: "2026-09-18",
  action: "Call",
  associatedWith: "Test Person",
  assignee: "Test User",
  vehicleOfInterest: "2026 Honda CR-V",
  status: "Done",
  department: "Sales",
  createdBy: "Test User",
  leadSource: "OEM",
  createdDate: "2026-09-18",
  year: "2026",
  make: "Honda",
  model: "CR-V",
  leadSourceName: "ThirdParty Honda",
  manuallyClosedBy: "",
  manuallyClosedTime: "",
  leadStatus: "Active",
  customStage: "",
  taskSource: "CRM",
  campaignName: "",
  campaignObjective: "",
  leadSourceGroup: "",
  completedBy: "",
};

describe("createTaskRecordId", () => {
  it("creates the same ID for the same task", () => {
    const first = createTaskRecordId(task);
    const second = createTaskRecordId(task);

    expect(first).toBe(second);
  });

  it("creates different IDs when identifying data changes", () => {
    const first = createTaskRecordId(task);

    const changedTask = {
      ...task,
      createdDate: "2026-09-19",
    };

    const second = createTaskRecordId(changedTask);

    expect(first).not.toBe(second);
  });
});