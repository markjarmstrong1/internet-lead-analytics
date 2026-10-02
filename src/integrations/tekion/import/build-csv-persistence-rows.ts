import type { ImportedCsvFile } from "@/integrations/import/import-batch";
import type { LeadPersistenceRow } from "@/integrations/tekion/lead/lead-persistence-row";
import { mapLeadRow } from "@/integrations/tekion/csv/map-lead-row";
import { mapTaskRow } from "@/integrations/tekion/csv/map-task-row";
import { createTaskRecordId } from "./create-task-record-id";
import type { SourceRecordPersistenceRow } from "@/integrations/import/source-record-persistence-row";
import {
  getTekionCsvType,
  importedCsvRecords,
} from "@/integrations/tekion/csv/imported-csv-records";

function parseNullableTimestamp(
  value: string,
  fieldName: string,
  fileName: string,
  rowNumber: number,
): string | null {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  const parsed = new Date(cleaned);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(
      `Invalid ${fieldName} on ${fileName}, row ${rowNumber}: ${value}`,
    );
  }

  return parsed.toISOString();
}

export function buildLeadPersistenceRows(
  files: ImportedCsvFile[],
): LeadPersistenceRow[] {
  const rows: LeadPersistenceRow[] = [];

  for (const file of files) {
    if (getTekionCsvType(file) !== "lead") {
      continue;
    }

    const records = importedCsvRecords(file);

    records.forEach((rawData, index) => {
      const rowNumber = index + 2;
      const lead = mapLeadRow(rawData);

      if (!lead.leadId) {
        throw new Error(
          `Lead CSV ${file.fileName}, row ${rowNumber} is missing Lead ID.`,
        );
      }

      rows.push({
        source_system: "tekion",
        source_type: "lead",
        external_record_id: lead.leadId,
        contact_name: lead.contactName,
        creation_time: parseNullableTimestamp(
          lead.creationTime,
          "Creation Time",
          file.fileName,
          rowNumber,
        ),
        source: lead.source,
        vehicle_interest: lead.vehicleInterest,
        source_type_detailed: lead.sourceTypeDetailed,
        lead_source_group: lead.leadSourceGroup,
        email: lead.email,
        mobile_phone: lead.mobilePhone,
        home_phone: lead.homePhone,
        work_phone: lead.workPhone,
        vehicle_year: lead.year,
        vehicle_make: lead.make,
        vehicle_model: lead.model,
        status: lead.status,
        stage: lead.stage,
        department: lead.department,
        dealership: lead.dealership,
        deal_status: lead.dealStatus,
        sold_date: parseNullableTimestamp(
          lead.soldDate,
          "Sold Date",
          file.fileName,
          rowNumber,
        ),
        closed_time: parseNullableTimestamp(
          lead.closedTime,
          "Closed Time",
          file.fileName,
          rowNumber,
        ),
        raw_data: {
          sourceKey: file.sourceKey,
          fileName: file.fileName,
          relativePath: file.relativePath,
          rowNumber,
          row: rawData,
        },
      });
    });
  }

  return rows;
}

export function buildTaskSourceRecordRows(
  files: ImportedCsvFile[],
): SourceRecordPersistenceRow[] {
  const rows: SourceRecordPersistenceRow[] = [];

  for (const file of files) {
    if (getTekionCsvType(file) !== "task") {
      continue;
    }

    const records = importedCsvRecords(file);

    records.forEach((rawData, index) => {
      const rowNumber = index + 2;
      const task = mapTaskRow(rawData);

      if (!task.taskTitle && !task.action && !task.associatedWith) {
        return;
      }

      rows.push({
        source_system: "tekion",
        source_type: "task",
        source_record_id: createTaskRecordId(task),
        raw_data: {
          sourceKey: file.sourceKey,
          fileName: file.fileName,
          relativePath: file.relativePath,
          rowNumber,
          row: rawData,
        },
      });
    });
  }

  return rows;
}