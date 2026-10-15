import "server-only";

import { getLeadDetail } from "@/integrations/tekion/lead/lead-detail-repository";
import { getMetricDefinition } from "../metrics/metric-definition";

export async function getLeadContributingEvents(metricId: string, leadId: string) {
  if (!getMetricDefinition(metricId) || metricId !== "response-rate") return null;
  const detail = await getLeadDetail(leadId);
  if (!detail) return null;

  const events = detail.timeline.flatMap((record) =>
    record.events.map((event) => ({
      ...event,
      timelineRecordId: record.id,
      timelineSourceFile: record.source_file,
    })),
  ).sort((a, b) => Date.parse(a.occurred_at) - Date.parse(b.occurred_at));

  const outbound = events.find((event) =>
    /outbound/.test((event.direction || "").toLowerCase()) &&
    /email|text|sms|call|phone|voicemail/.test(
      `${event.channel || ""} ${event.raw_type} ${event.category}`.toLowerCase(),
    ),
  );
  const inbound = outbound ? events.find((event) =>
    Date.parse(event.occurred_at) >= Date.parse(outbound.occurred_at) &&
    /inbound/.test((event.direction || "").toLowerCase()),
  ) : undefined;

  return {
    lead: detail.lead,
    events,
    contributingEventIds: [outbound?.id, inbound?.id].filter((id): id is string => Boolean(id)),
  };
}
