import type { TekionTaskRecord } from "../csv/task-record";
import { mapTaskSourceRecord } from "./map-task-source-record";

export function buildTaskObservations(
  tasks: Array<{
    record: TekionTaskRecord;
    rawData: Record<string, unknown>;
  }>,
) {
  return tasks.map(({ record, rawData }) =>
    mapTaskSourceRecord(record, rawData),
  );
}