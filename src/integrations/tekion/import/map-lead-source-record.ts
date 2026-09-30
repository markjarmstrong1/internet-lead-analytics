import type { TekionLeadRecord } from "../csv/lead-record";
import type { TekionSourceRecord } from "./source-record";

export function mapLeadToSourceRecord(
  lead: TekionLeadRecord,
  rawData: Record<string, unknown>,
): TekionSourceRecord {
  return {
    sourceSystem: "tekion",
    sourceType: "lead",
    sourceRecordId: lead.leadId,
    rawData,
  };
}