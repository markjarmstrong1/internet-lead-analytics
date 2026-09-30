import type { TekionLeadRecord } from "../csv/lead-record";
import { mapLeadToSourceRecord } from "./map-lead-source-record";

export function buildLeadObservations(
  leads: Array<{
    record: TekionLeadRecord;
    rawData: Record<string, unknown>;
  }>,
) {
  return leads.map(({ record, rawData }) =>
    mapLeadToSourceRecord(record, rawData),
  );
}