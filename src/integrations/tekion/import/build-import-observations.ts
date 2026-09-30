import type { TekionLeadRecord } from "../csv/lead-record";
import type { TekionTaskRecord } from "../csv/task-record";
import { buildLeadObservations } from "./build-lead-observations";
import { buildTaskObservations } from "./build-task-observations";
import type { TekionSourceObservation } from "./source-observation";

export type ImportObservationInput = {
  leads: Array<{
    record: TekionLeadRecord;
    rawData: Record<string, unknown>;
  }>;
  tasks: Array<{
    record: TekionTaskRecord;
    rawData: Record<string, unknown>;
  }>;
};

export type ImportObservationResult = {
  leadObservations: TekionSourceObservation[];
  taskObservations: TekionSourceObservation[];
  observations: TekionSourceObservation[];
};

export function buildImportObservations(
  input: ImportObservationInput,
): ImportObservationResult {
  const leadObservations = buildLeadObservations(input.leads);
  const taskObservations = buildTaskObservations(input.tasks);

  return {
    leadObservations,
    taskObservations,
    observations: [
      ...leadObservations,
      ...taskObservations,
    ],
  };
}