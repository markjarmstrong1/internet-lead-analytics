import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import { average, median } from "./analytics-observations";
import {
  buildEmailEvidence,
  type EmailEvidence,
} from "./email-evidence";

export type EmailTemplateEngagementRow = {
  template: string;
  sends: number;
  leads: number;
  opens: number;
  openedSends: number;
  openRate: number | null;
  clicks: number;
  responded: number;
  responseRate: number | null;
  firstInbound: number;
  firstInboundRate: number | null;
  averageFirstResponseMinutes: number | null;
  medianFirstResponseMinutes: number | null;
};

export type EmailEngagementAnalysis = {
  sends: number;
  leads: number;
  opens: number;
  openedSends: number;
  openRate: number | null;
  clicks: number;

  attributedResponses: number;
  firstInbound: number;
  firstInboundRate: number | null;
  averageFirstResponseMinutes: number | null;
  medianFirstResponseMinutes: number | null;

  templates: EmailTemplateEngagementRow[];
};

export function buildEmailEngagementAnalysis(
  dataset: AnalyticsDataset,
): EmailEngagementAnalysis {
  const leadByTimelineRecord = new Map<string, string>();

  for (const lead of dataset.leads) {
    for (const timelineRecordId of lead.timelineRecordIds) {
      leadByTimelineRecord.set(
        timelineRecordId,
        lead.leadId,
      );
    }
  }

  const eventsByTimelineRecord = new Map<
    string,
    typeof dataset.events
  >();

  for (const event of dataset.events) {
    const existing =
      eventsByTimelineRecord.get(
        event.timelineRecordId,
      );

    if (existing) {
      existing.push(event);
    } else {
      eventsByTimelineRecord.set(
        event.timelineRecordId,
        [event],
      );
    }
  }

  const allEvidence = [
    ...eventsByTimelineRecord.values(),
  ].flatMap((events) =>
    buildEmailEvidence(events),
  );

  const sends = allEvidence.length;

  const leads = new Set(
    allEvidence
      .map((row) =>
        leadByTimelineRecord.get(
          row.event.timelineRecordId,
        ),
      )
      .filter(
        (leadId): leadId is string =>
          Boolean(leadId),
      ),
  ).size;

  const opens = allEvidence.reduce(
    (total, row) => total + row.opens,
    0,
  );

  const openedSends = allEvidence.filter(
    (row) => row.opened,
  ).length;

  const clicks = allEvidence.reduce(
    (total, row) => total + row.clicks,
    0,
  );

  const responses = allEvidence.filter(
    (row) => row.firstInbound !== null,
  );

  const responseTimes = responses
    .map((row) => row.firstInboundMinutes)
    .filter(
      (value): value is number =>
        value !== null,
    );

  return {
    sends,
    leads,
    opens,
    openedSends,
    openRate: ratio(
      openedSends,
      sends,
    ),
    clicks,
    attributedResponses:
      responses.length,
    firstInbound:
      responses.length,
    firstInboundRate: ratio(
      responses.length,
      sends,
    ),
    averageFirstResponseMinutes:
      average(responseTimes),
    medianFirstResponseMinutes:
      median(responseTimes),
    templates:
      buildTemplateRows(
        allEvidence,
        leadByTimelineRecord,
      ),
  };
}

function buildTemplateRows(
  evidence: EmailEvidence[],
  leadByTimelineRecord: Map<string, string>,
): EmailTemplateEngagementRow[] {
  const groups = new Map<
    string,
    EmailEvidence[]
  >();

  for (const row of evidence) {
    const template =
      row.templateCode?.trim() ||
      "unmatched";

    const existing = groups.get(template);

    if (existing) {
      existing.push(row);
    } else {
      groups.set(template, [row]);
    }
  }

  return [...groups.entries()]
    .map(([template, rows]) => {
      const responseRows =
        rows.filter(
          (row) =>
            row.firstInbound !== null,
        );

      const responseTimes =
        responseRows
          .map(
            (row) =>
              row.firstInboundMinutes,
          )
          .filter(
            (value): value is number =>
              value !== null,
          );

      const leads = new Set(
        rows
          .map((row) =>
            leadByTimelineRecord.get(
              row.event.timelineRecordId,
            ),
          )
          .filter(
            (leadId): leadId is string =>
              Boolean(leadId),
          ),
      ).size;

      const openedSends =
        rows.filter(
          (row) => row.opened,
        ).length;

      return {
        template,
        sends: rows.length,
        leads,
        opens: rows.reduce(
          (total, row) =>
            total + row.opens,
          0,
        ),
        openedSends,
        openRate: ratio(
          openedSends,
          rows.length,
        ),
        clicks: rows.reduce(
          (total, row) =>
            total + row.clicks,
          0,
        ),
        responded:
          responseRows.length,
        responseRate: ratio(
          responseRows.length,
          rows.length,
        ),
        firstInbound:
          responseRows.length,
        firstInboundRate: ratio(
          responseRows.length,
          rows.length,
        ),
        averageFirstResponseMinutes:
          average(responseTimes),
        medianFirstResponseMinutes:
          median(responseTimes),
      };
    })
    .sort(
      (left, right) =>
        right.sends - left.sends ||
        left.template.localeCompare(
          right.template,
        ),
    );
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}
