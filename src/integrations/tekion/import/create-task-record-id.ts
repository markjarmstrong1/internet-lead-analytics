import { createHash } from "node:crypto";
import type { TekionTaskRecord } from "../csv/task-record";

export function createTaskRecordId(task: TekionTaskRecord): string {
  const identity = [
    task.taskTitle,
    task.action,
    task.associatedWith,
    task.assignee,
    task.vehicleOfInterest,
    task.createdDate,
    task.createdBy,
    task.taskSource,
  ].join("|");

  return createHash("sha256")
    .update(identity)
    .digest("hex");
}