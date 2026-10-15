import type { AnalyticsLead } from "@/analytics/data/analytics-repository";
import type { AnalyticsEvent } from "@/analytics/data/analytics-types";
import type { ProgressionRule, ProgressionStage, StageEntry, StageEvidence } from "./progression-types";

function validTimestamp(value: string | null | undefined): string | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function isInboundCustomerCommunication(event: AnalyticsEvent): boolean {
  const inbound = event.direction?.toLowerCase() === "inbound";
  const customerActor = /customer|consumer|prospect|lead/i.test(event.actorType);
  const channel = ["email", "text", "phone", "voicemail"].includes(event.channel ?? "");
  return inbound && channel && (customerActor || event.actorType.trim().toLowerCase() === "unknown");
}

function isConnectedCall(event: AnalyticsEvent): boolean {
  const call = /call|phone/i.test([event.rawType, event.category, event.channel ?? ""].join(" "));
  const connected = /connected|answered|conversation|spoke with|talked to/i.test(
    [event.rawType, event.details].join(" "),
  );
  return call && connected && event.direction !== "outbound";
}

function isConversationStageEvent(events: AnalyticsEvent[]): AnalyticsEvent | null {
  const engagement = events.find((event) => isInboundCustomerCommunication(event) || isConnectedCall(event));
  if (!engagement) return null;
  const engagementTime = Date.parse(engagement.occurredAt);
  const laterEvents = events.filter((event) => Date.parse(event.occurredAt) > engagementTime);
  const laterConnectedCall = laterEvents.find(isConnectedCall);
  if (laterConnectedCall) return laterConnectedCall;
  const followupOutbound = laterEvents.find((event) =>
    event.direction?.toLowerCase() === "outbound" &&
    /employee|staff|salesperson|agent/i.test(event.actorType),
  );
  if (!followupOutbound) return null;
  const outboundTime = Date.parse(followupOutbound.occurredAt);
  return laterEvents.find((event) =>
    isInboundCustomerCommunication(event) && Date.parse(event.occurredAt) > outboundTime,
  ) ?? null;
}

function isAppointmentCreated(event: AnalyticsEvent): boolean {
  const text = [event.rawType, event.category, event.details].join(" ").toLowerCase();
  return /appt\. created|appointment created|appointment scheduled|appointment set/.test(text)
    && !/deleted|cancelled|canceled/.test(text);
}

function isShowAttendance(event: AnalyticsEvent): boolean {
  const text = [event.rawType, event.category, event.details].join(" ").toLowerCase();
  return /customer (arrived|arrives|checked in|checked-in)|showed (up|at)|showroom visit|arrived at dealership|visit completed/.test(text);
}

function isSaleEvent(event: AnalyticsEvent): boolean {
  const text = [event.rawType, event.category, event.details].join(" ").toLowerCase();
  return /deal sold|vehicle sold|sale completed|sold vehicle|deal closed/.test(text);
}

function evidenceForEvent(
  event: AnalyticsEvent,
  classification: "observed" | "inferred",
  basis: string,
  summary: string,
): StageEvidence {
  return {
    classification,
    basis,
    eventIds: event.sourceEventId ? [event.sourceEventId] : [],
    timelineRecordIds: [event.timelineRecordId],
    sourceFiles: event.sourceFile ? [event.sourceFile] : [],
    summary,
  };
}

export function qualifyStage(input: {
  lead: AnalyticsLead;
  events: AnalyticsEvent[];
  rule: ProgressionRule;
}): StageEntry {
  const { lead, events, rule } = input;
  const ordered = [...events].filter((event) => Number.isFinite(Date.parse(event.occurredAt)))
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt));
  const stage = rule.stage;
  let matched: AnalyticsEvent | null = null;
  let enteredAt: string | null = null;
  let evidence: StageEvidence[] = [];

  if (stage === "new_lead") {
    enteredAt = validTimestamp(lead.creationTime);
    if (enteredAt) {
      evidence = [{
        classification: "observed",
        basis: "canonical_lead.creation_time",
        eventIds: [],
        timelineRecordIds: lead.timelineRecordIds,
        sourceFiles: [],
        summary: "Lead creation timestamp is present in the canonical lead record.",
      }];
    }
  } else if (stage === "engaged" || stage === "conversation") {
    matched = ordered.find((event) => isInboundCustomerCommunication(event) || isConnectedCall(event)) ?? null;
    if (matched) {
      enteredAt = validTimestamp(matched.occurredAt);
      evidence = [evidenceForEvent(
        matched,
        "observed",
        isInboundCustomerCommunication(matched) ? "inbound_customer_communication" : "connected_phone_call",
        stage === "engaged" ? "Qualifying customer response or connected call was observed." : "A qualifying two-way customer interaction was observed.",
      )];
    }
  } else if (stage === "appointment") {
    matched = ordered.find(isAppointmentCreated) ?? null;
    if (matched) {
      enteredAt = validTimestamp(matched.occurredAt);
      evidence = [evidenceForEvent(matched, "observed", "appointment_created", "Timeline records a qualifying appointment creation.")];
    }
  } else if (stage === "show") {
    matched = ordered.find(isShowAttendance) ?? null;
    if (matched) {
      enteredAt = validTimestamp(matched.occurredAt);
      evidence = [evidenceForEvent(matched, "observed", "explicit_show_attendance", "Timeline contains explicit showroom attendance evidence.")];
    }
  } else if (stage === "sold") {
    enteredAt = validTimestamp(lead.soldDate);
    if (enteredAt) {
      evidence = [{
        classification: "observed",
        basis: "canonical_lead.sold_date",
        eventIds: [],
        timelineRecordIds: lead.timelineRecordIds,
        sourceFiles: [],
        summary: "Canonical sold date supports a sale outcome.",
      }];
    } else {
      matched = ordered.find(isSaleEvent) ?? null;
      if (matched) {
        enteredAt = validTimestamp(matched.occurredAt);
        evidence = [evidenceForEvent(matched, "observed", "explicit_sale_event", "Timeline contains explicit sale outcome evidence.")];
      }
    }
  }

  const status: StageEntry["status"] = enteredAt
    ? "qualified"
    : stage === "new_lead"
      ? "unresolved"
      : lead.timelineRecordIds.length === 0
        ? "unresolved"
        : "not_qualified";

  return {
    leadId: lead.leadId,
    stage,
    enteredAt,
    status,
    ruleKey: rule.ruleKey,
    ruleVersion: rule.version,
    evidence,
  };
}

export function qualifyAllStages(input: {
  lead: AnalyticsLead;
  events: AnalyticsEvent[];
  rules: ProgressionRule[];
}): StageEntry[] {
  const byStage = new Map<ProgressionStage, ProgressionRule>();
  for (const rule of input.rules) {
    if (rule.isActive && !byStage.has(rule.stage)) byStage.set(rule.stage, rule);
  }
  return [...byStage.values()].map((rule) =>
    qualifyStage({ lead: input.lead, events: input.events, rule }),
  );
}
