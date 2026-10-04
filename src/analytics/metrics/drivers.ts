import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
} from "./analytics-observations";

export type SourceDriverRow = {
  source: string;
  leads: number;
  timelineCovered: number;
  contacted: number;
  respondedWithin24h: number;
  appointmentEvidence: number;
  soldClosed: number;
};

export type OutreachBucketRow = {
  label: string;
  contacted: number;
  respondedWithin24h: number;
  appointmentEvidence: number;
  responseRate: number | null;
};

export type ProcessAnalysis = {
  taskLeads: number;
  taskEvents: number;
  taskEventsFollowedByOutbound24h: number;
  taskEventsWithoutObservedOutbound24h: number;
};

export type DriversAnalysis = {
  sources: SourceDriverRow[];
  outreach: OutreachBucketRow[];
  process: ProcessAnalysis;
};

export function buildDriversAnalysis(
  dataset: AnalyticsDataset,
): DriversAnalysis {
  const observations =
    buildLeadObservations(dataset);

  const sources = buildSourceRows(
    dataset,
    observations,
  );

  const outreach = buildOutreachRows(
    observations.filter(
      (observation) =>
        observation.firstOutbound !== null,
    ),
  );

  return {
    sources,
    outreach,
    process: buildProcessAnalysis(
      dataset,
      observations,
    ),
  };
}

function buildSourceRows(
  dataset: AnalyticsDataset,
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): SourceDriverRow[] {
  const observationsByLead = new Map(
    observations.map((observation) => [
      observation.lead.leadId,
      observation,
    ]),
  );

  const groups = new Map<
    string,
    AnalyticsDataset["leads"]
  >();

  for (const lead of dataset.leads) {
    const source =
      lead.source.trim() || "Unknown source";

    const existing = groups.get(source);

    if (existing) {
      existing.push(lead);
    } else {
      groups.set(source, [lead]);
    }
  }

  return [...groups.entries()]
    .map(([source, leads]) => {
      const sourceObservations =
        leads
          .map((lead) =>
            observationsByLead.get(
              lead.leadId,
            ),
          )
          .filter(
            (
              value,
            ): value is ReturnType<
              typeof buildLeadObservations
            >[number] =>
              value !== undefined,
          );

      return {
        source,
        leads: leads.length,
        timelineCovered: leads.filter(
          (lead) =>
            lead.timelineRecordIds.length > 0,
        ).length,
        contacted: sourceObservations.filter(
          (observation) =>
            observation.firstOutbound !== null,
        ).length,
        respondedWithin24h:
          sourceObservations.filter(
            (observation) =>
              observation.respondedWithin24h,
          ).length,
        appointmentEvidence:
          sourceObservations.filter(
            (observation) =>
              observation.appointmentEvidence,
          ).length,
        soldClosed: leads.filter(
          (lead) =>
            ["sold", "closed"].includes(
              lead.stage.trim().toLowerCase(),
            ),
        ).length,
      };
    })
    .sort(
      (left, right) =>
        right.leads - left.leads ||
        left.source.localeCompare(right.source),
    );
}

function buildOutreachRows(
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): OutreachBucketRow[] {
  const buckets = [
    {
      label: "1–5 attempts",
      matches: (count: number) =>
        count >= 1 && count <= 5,
    },
    {
      label: "6–10 attempts",
      matches: (count: number) =>
        count >= 6 && count <= 10,
    },
    {
      label: "11–20 attempts",
      matches: (count: number) =>
        count >= 11 && count <= 20,
    },
    {
      label: "21+ attempts",
      matches: (count: number) =>
        count >= 21,
    },
  ];

  return buckets.map((bucket) => {
    const rows = observations.filter(
      (observation) =>
        bucket.matches(
          observation.outboundCount,
        ),
    );

    return {
      label: bucket.label,
      contacted: rows.length,
      respondedWithin24h:
        rows.filter(
          (observation) =>
            observation.respondedWithin24h,
        ).length,
      appointmentEvidence:
        rows.filter(
          (observation) =>
            observation.appointmentEvidence,
        ).length,
      responseRate: ratio(
        rows.filter(
          (observation) =>
            observation.responseMinutes !== null,
        ).length,
        rows.length,
      ),
    };
  });
}

function buildProcessAnalysis(
  dataset: AnalyticsDataset,
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): ProcessAnalysis {
  const taskEvents = dataset.events.filter(
    (event) => event.category === "task",
  );

  const taskLeads = new Set(
    taskEvents.map(
      (event) => event.timelineRecordId,
    ),
  );

  const eventsByRecord = new Map<
    string,
    typeof dataset.events
  >();

  for (const event of dataset.events) {
    const existing = eventsByRecord.get(
      event.timelineRecordId,
    );

    if (existing) {
      existing.push(event);
    } else {
      eventsByRecord.set(event.timelineRecordId, [
        event,
      ]);
    }
  }

  let followed = 0;

  for (const taskEvent of taskEvents) {
    const related =
      eventsByRecord.get(
        taskEvent.timelineRecordId,
      ) ?? [];

    const taskTime = Date.parse(
      taskEvent.occurredAt,
    );

    const hasOutbound = related.some((event) => {
      const eventTime = Date.parse(
        event.occurredAt,
      );

      return (
        event.category === "communication" &&
        event.actorType === "employee" &&
        event.direction === "outbound" &&
        event.channel !== null &&
        eventTime >= taskTime &&
        eventTime <=
          taskTime + 24 * 60 * 60 * 1000
      );
    });

    if (hasOutbound) {
      followed += 1;
    }
  }

  void observations;

  return {
    taskLeads: taskLeads.size,
    taskEvents: taskEvents.length,
    taskEventsFollowedByOutbound24h:
      followed,
    taskEventsWithoutObservedOutbound24h:
      taskEvents.length - followed,
  };
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}
