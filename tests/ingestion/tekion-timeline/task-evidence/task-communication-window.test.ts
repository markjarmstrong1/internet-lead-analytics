import { describe, expect, it } from "vitest";
import { buildTaskCommunicationWindow, isEventWithinTaskWindow } from "../../../../src/integrations/tekion/timeline/task-evidence/task-communication-window";
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
    status: "Done",
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

describe("Task communication window", () => {
  it("creates a bounded window from created and due dates", () => {
    const window = buildTaskCommunicationWindow(
      task(),
    );

    expect(window.status).toBe("bounded");
    expect(window.startAt).toBeDefined();
    expect(window.endAt).toBeDefined();
  });

  it("includes events inside the bounded window", () => {
    const window = buildTaskCommunicationWindow(
      task(),
    );

    expect(
      isEventWithinTaskWindow(
        "2026-09-23T12:00:00.000Z",
        window,
      ),
    ).toBe(true);

    expect(
      isEventWithinTaskWindow(
        "2026-09-24T23:59:59.000Z",
        window,
      ),
    ).toBe(true);
  });

  it("excludes events outside the bounded window", () => {
    const window = buildTaskCommunicationWindow(
      task(),
    );

    expect(
      isEventWithinTaskWindow(
        "2026-09-25T00:00:00.000Z",
        window,
      ),
    ).toBe(false);
  });

  it("reports an unavailable window when a date is missing", () => {
    expect(
      buildTaskCommunicationWindow(
        task({ dueDate: "" }),
      ).status,
    ).toBe("unavailable");
  });

  it("reports an invalid window when due date precedes creation", () => {
    expect(
      buildTaskCommunicationWindow(
        task({
          createdDate: "Sep 25 2026",
          dueDate: "Sep 24 2026",
        }),
      ).status,
    ).toBe("invalid");
  });
});
