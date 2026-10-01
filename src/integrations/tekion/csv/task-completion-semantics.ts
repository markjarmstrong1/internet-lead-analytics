import type { TekionTaskRecord } from "./task-record";

export type TekionTaskCompletionMode =
  | "completed_automatically"
  | "completed_manually"
  | "dismissed"
  | "overdue"
  | "pending"
  | "unknown";

export function classifyTaskCompletion(
  task: TekionTaskRecord,
): TekionTaskCompletionMode {
  const status = task.status.trim().toLowerCase();
  const manuallyClosed = task.manuallyClosedBy.trim().length > 0;

  switch (status) {
    case "done":
      return manuallyClosed
        ? "completed_manually"
        : "completed_automatically";

    case "dismissed":
      return "dismissed";

    case "overdue":
      return "overdue";

    case "pending":
      return "pending";

    default:
      return "unknown";
  }
}
