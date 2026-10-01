import { describe, expect, it } from "vitest";
import { classifyTaskCompletion } from "../../../../src/integrations/tekion/csv/task-completion-semantics";
import type { TekionTaskRecord } from "../../../../src/integrations/tekion/csv/task-record";

function task(
  overrides: Partial<TekionTaskRecord> = {},
): TekionTaskRecord {
  return {
    taskTitle: "Follow Up",
    dueDate: "Sep 24 2026",
    action: "Call",
    associatedWith: "Test Lead",
    assignee: "Employee",
    vehicleOfInterest: "",
    status: "Pending",
    department: "",
    createdBy: "System",
    leadSource: "",
    createdDate: "Sep 23 2026",
    year: "",
    make: "",
    model: "",
    leadSourceName: "",
    manuallyClosedBy: "",
    manuallyClosedTime: "",
    leadStatus: "",
    customStage: "",
    taskSource: "",
    campaignName: "",
    campaignObjective: "",
    leadSourceGroup: "",
    completedBy: "",
    ...overrides,
  };
}

describe("classifyTaskCompletion", () => {
  it("classifies Done with no manual closer as automatic completion", () => {
    expect(
      classifyTaskCompletion(
        task({
          status: "Done",
          manuallyClosedBy: "",
        }),
      ),
    ).toBe("completed_automatically");
  });

  it("classifies Done with a manual closer separately", () => {
    expect(
      classifyTaskCompletion(
        task({
          status: "Done",
          manuallyClosedBy: "Employee",
        }),
      ),
    ).toBe("completed_manually");
  });

  it("preserves Dismissed as a distinct outcome", () => {
    expect(
      classifyTaskCompletion(
        task({ status: "Dismissed" }),
      ),
    ).toBe("dismissed");
  });

  it("preserves Overdue and Pending", () => {
    expect(
      classifyTaskCompletion(
        task({ status: "Overdue" }),
      ),
    ).toBe("overdue");

    expect(
      classifyTaskCompletion(
        task({ status: "Pending" }),
      ),
    ).toBe("pending");
  });

  it("does not invent semantics for unknown statuses", () => {
    expect(
      classifyTaskCompletion(
        task({ status: "Something Else" }),
      ),
    ).toBe("unknown");
  });
});
