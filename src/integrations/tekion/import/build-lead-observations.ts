import type { TekionLeadRecord } from "../csv/lead-record";
import { mapLeadSourceRecord } from "./map-lead-source-record";

export function buildLeadObservations(
  leads: Array<{
    record: TekionLeadRecord;
    rawData: Record<string, unknown>;
  }>,
) {
  return leads.map(({ record, rawData }) =>
    mapLeadSourceRecord(record, rawData),
  );
}