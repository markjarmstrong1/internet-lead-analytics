import type { TekionTaskRecord } from "../csv/task-record";
import { createTaskRecordId } from "./create-task-record-id";
import type { TekionSourceRecord } from "./source-record";

export function mapTaskToSourceRecord(
  task: TekionTaskRecord,
  rawData: Record<string, unknown>,
): TekionSourceRecord {
  return {
    sourceSystem: "tekion",
    sourceType: "task",
    sourceRecordId: createTaskRecordId(task),
    rawData,
  };
}