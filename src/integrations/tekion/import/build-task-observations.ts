import type { TekionTaskRecord } from "../csv/task-record";
import { mapTaskToSourceRecord } from "./map-task-source-record";

export function buildTaskObservations(
  tasks: Array<{
    record: TekionTaskRecord;
    rawData: Record<string, unknown>;
  }>,
) {
  return tasks.map(({ record, rawData }) =>
    mapTaskToSourceRecord(record, rawData),
  );
}