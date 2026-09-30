import { mapLeadRow } from "../csv/map-lead-row";
import { mapTaskRow } from "../csv/map-task-row";
import type { TekionLeadRecord } from "../csv/lead-record";
import type { TekionTaskRecord } from "../csv/task-record";
import { selectLeadMatch } from "../matching/select-lead-match";
import type { TekionIngestionResult } from "./ingestion-result";
import { mapLeadToSourceRecord } from "./map-lead-source-record";
import { mapTaskToSourceRecord } from "./map-task-source-record";
import type { TekionSourceRecord } from "./source-record";

export function buildTekionIngestionResult(
  leadRows: Record<string, unknown>[],
  taskRows: Record<string, unknown>[],
): TekionIngestionResult {
  const leads = leadRows.map(mapLeadRow);
  const tasks = taskRows.map(mapTaskRow);

  const leadSourceRecords: TekionSourceRecord[] = leadRows.map(
    (row, index) =>
      mapLeadToSourceRecord(leads[index], row),
  );

  const taskSourceRecords: TekionSourceRecord[] = taskRows.map(
    (row, index) =>
      mapTaskToSourceRecord(tasks[index], row),
  );

  const taskMatches = tasks.map((task, index) => {
    const taskRecord = taskSourceRecords[index];

    const result = selectLeadMatch(
      {
        taskName: task.associatedWith,
        taskYear: task.year,
        taskMake: task.make,
        taskModel: task.model,
        taskLeadSource: task.leadSource,
        taskLeadSourceName: task.leadSourceName,
        taskLeadSourceGroup: task.leadSourceGroup,
      },
      leads.map((lead) => ({
        leadId: lead.leadId,
        leadName: lead.contactName,
        leadYear: lead.year,
        leadMake: lead.make,
        leadModel: lead.model,
        leadSource: lead.source,
        leadSourceGroup: lead.leadSourceGroup,
      })),
    );

    return {
      taskRecordId: taskRecord.sourceRecordId,
      status: result.status,
      leadId: result.leadId,
      features: result.features,
      candidateLeadIds: result.candidates.map(
        (candidate) => candidate.leadId,
      ),
    };
  });

  const matchedTaskCount = taskMatches.filter(
    (match) => match.status === "matched",
  ).length;

  const ambiguousTaskCount = taskMatches.filter(
    (match) => match.status === "ambiguous",
  ).length;

  const unmatchedTaskCount = taskMatches.filter(
    (match) => match.status === "unmatched",
  ).length;

  return {
    leads,
    tasks,
    leadSourceRecords,
    taskSourceRecords,
    taskMatches,
    summary: {
      leadCount: leads.length,
      taskCount: tasks.length,
      matchedTaskCount,
      ambiguousTaskCount,
      unmatchedTaskCount,
    },
  };
}