import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { getLeadContributingEvents } from "./get-lead-contributing-events";

export async function getMetricEvidence(metricId: string, leadId: string, eventId: string) {
  const contribution = await getLeadContributingEvents(metricId, leadId);
  if (!contribution) return null;

  const event = contribution.events.find((item) => item.id === eventId);
  if (!event) return null;

  const client = createServerSupabaseClient();
  const recordResult = await client
    .from("timeline_records")
    .select("id,lead_id,import_id,source_file,external_record_id,raw_data")
    .eq("id", event.timelineRecordId)
    .maybeSingle();

  if (recordResult.error) throw new Error(`Failed to load timeline provenance: ${recordResult.error.message}`);

  const sourceRecordResult = await client
    .from("source_records")
    .select("id,import_id,source_record_id,source_type,source_system,raw_data")
    .eq("source_record_id", event.source_event_id)
    .limit(10);

  if (sourceRecordResult.error) throw new Error(`Failed to load source evidence: ${sourceRecordResult.error.message}`);

  const importId = recordResult.data?.import_id ?? sourceRecordResult.data?.[0]?.import_id ?? null;
  const importResult = importId
    ? await client.from("source_imports").select("id,file_name,import_type,imported_at,status").eq("id", importId).maybeSingle()
    : { data: null, error: null };

  if (importResult.error) throw new Error(`Failed to load source import: ${importResult.error.message}`);

  return {
    event,
    timelineRecord: recordResult.data,
    sourceRecords: sourceRecordResult.data ?? [],
    sourceImport: importResult.data,
    provenanceState: sourceRecordResult.data?.length ? "linked" : "source-record-not-linked",
  };
}
