import type { TekionLeadRecord } from "../csv/lead-record";
import type { TekionTaskRecord } from "../csv/task-record";
import type { TekionSourceRecord } from "./source-record";

export type TekionTaskMatch = {
  taskRecordId: string;
  status: "matched" | "ambiguous" | "unmatched";
  leadId?: string;
  features: string[];
  candidateLeadIds: string[];
};

export type TekionIngestionSummary = {
  leadCount: number;
  taskCount: number;
  matchedTaskCount: number;
  ambiguousTaskCount: number;
  unmatchedTaskCount: number;
};

export type TekionIngestionResult = {
  leads: TekionLeadRecord[];
  tasks: TekionTaskRecord[];
  leadSourceRecords: TekionSourceRecord[];
  taskSourceRecords: TekionSourceRecord[];
  taskMatches: TekionTaskMatch[];
  summary: TekionIngestionSummary;
};