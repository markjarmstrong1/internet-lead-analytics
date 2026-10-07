import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  contactSpeedBucket,
  CONTACT_SPEED_BUCKETS,
  average,
  median,
  responseSpeedBucket,
  RESPONSE_SPEED_BUCKETS,
} from "@/analytics/observations/analytics-observations";
import {
  buildEmailEngagementAnalysis,
  type EmailEngagementAnalysis,
} from "./email-engagement";
import {
  buildFirstResponseAnalysis,
  type FirstResponseAnalysis,
} from "./first-response-analysis";

export type DashboardMetric = {
  count: number;
  denominator: number;
  rate: number | null;
};

export type ContactSpeedRow = {
  key: string;
  label: string;
  contacted: number;
  rate: number | null;
};

export type ResponseSpeedRow = {
  key: string;
  label: string;
  contacted: number;
  responded: number;
  responseRate: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type ChannelRow = {
  channel: string;
  contacted: number;
  responded: number;
  responseRate: number | null;
  respondedWithin24h: number;
  responseWithin24hRate: number | null;
};

export type SourceRow = {
  source: string;
  sourceGroup: string;
  leads: number;
  mixRate: number | null;
  timelineCovered: number;
  timelineCoverageRate: number | null;
  contacted: number;
  contactRate: number | null;
  medianFirstContactMinutes: number | null;
  responded: number;
  responseRate: number | null;
  respondedWithin24h: number;
  responseWithin24hRate: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type TrendRow = {
  month: string;
  label: string;
  leads: number;
  contacted: number;
  contactRate: number | null;
  responded: number;
  responseRate: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type InvestigationRow = {
  leadId: string;
  contactName: string;
  source: string;
  sourceGroup: string;
  stage: string;
  createdAt: string | null;
  timelineCovered: boolean;
  firstContactAt: string | null;
  firstContactMinutes: number | null;
  firstContactChannel: string | null;
  firstAction: string | null;
  firstTemplate: string | null;
  responseAt: string | null;
  responseMinutes: number | null;
  appointmentEvidence: boolean;
  soldClosed: boolean;
};


export type ActionRow = {
  action: string;
  channel: string | null;
  contacted: number;
  responded: number;
  responseRate: number | null;
  averageResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type ResponseActionRow = {
  action: string;
  channel: string | null;
  responses: number;
  averageResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
};

export type TemplateRow = {
  template: string;
  templateSource: string;
  uses: number;
  leads: number;
  responded: number;
  responseRate: number | null;
  averageResponseMinutes: number | null;
  medianResponseMinutes: number | null;
  appointmentEvidence: number;
  appointmentRate: number | null;
  soldClosed: number;
  soldClosedRate: number | null;
};

export type SoldLeadAnalytics = {
  soldClosed: number;
  timelineCovered: number;
  timelineCoverageRate: number | null;
  contacted: number;
  responded: number;
  averageFirstContactMinutes: number | null;
  medianFirstContactMinutes: number | null;
  averageFirstResponseMinutes: number | null;
  medianFirstResponseMinutes: number | null;
  respondedWithin24h: number;
  responseWithin24hRate: number | null;
  averageOutboundBeforeResponse: number | null;
  firstActions: ActionRow[];
  responseActions: ResponseActionRow[];
  templates: TemplateRow[];
};

export type DashboardAnalysis = {
  acquisition: {
    leads: number;
    timelineCovered: number;
    timelineCoverageRate: number | null;
    unknownSource: number;
    sourceGroups: number;
  };

  contact: {
    contacted: number;
    notContacted: number;
    contactRate: number | null;
    medianFirstContactMinutes: number | null;
    validFirstContactTimes: number;
    contactSpeed: ContactSpeedRow[];
  };

  engagement: {
    contacted: number;
    responseEligible: number;
    responseEvidenceCoverageRate: number | null;
    responded: number;
    responseRate: number | null;
    respondedWithin24h: number;
    responseWithin24hRate: number | null;
    medianResponseMinutes: number | null;
    speed: ResponseSpeedRow[];
    channels: ChannelRow[];
    email: EmailEngagementAnalysis;
    firstResponse: FirstResponseAnalysis;
  };

  soldLeadAnalytics: SoldLeadAnalytics;

  progression: {
    appointmentEvidence: number;
    appointmentRateOfAll: number | null;
    appointmentRateOfContacted: number | null;
    appointmentRateOfResponded: number | null;
    soldClosed: number;
    soldClosedRateOfAll: number | null;
    soldClosedRateOfContacted: number | null;
    soldClosedWithTimeline: number;
    soldClosedWithoutTimeline: number;
  };

  sources: SourceRow[];
  trends: TrendRow[];
  investigation: InvestigationRow[];
};

export function buildDashboardAnalysis(
  dataset: AnalyticsDataset,
): DashboardAnalysis {
  const observations =
    buildLeadObservations(dataset);

  const totalLeads = dataset.leads.length;

  const timelineCovered = dataset.leads.filter(
    (lead) =>
      lead.timelineRecordIds.length > 0,
  ).length;

  const contacted = observations.filter(
    (observation) =>
      observation.firstContactedTime !== null,
  );

  const responseEligible = contacted.filter(
    (observation) =>
      observation.lead.timelineRecordIds.length > 0,
  );

  const responded = responseEligible.filter(
    (observation) =>
      observation.responseMinutes !== null,
  );

  const respondedWithin24h =
    responseEligible.filter(
      (observation) =>
        observation.respondedWithin24h,
    );

  const appointmentEvidence =
    observations.filter(
      (observation) =>
        observation.appointmentEvidence,
    );

  const soldClosed = observations.filter(
    (observation) =>
      observation.soldClosed,
  );

  const contactedAppointmentEvidence =
    contacted.filter(
      (observation) =>
        observation.appointmentEvidence,
    );

  const respondedAppointmentEvidence =
    responded.filter(
      (observation) =>
        observation.appointmentEvidence,
    );

  const contactedSoldClosed =
    contacted.filter(
      (observation) =>
        observation.soldClosed,
    );

  const validFirstContactTimes =
    contacted.filter(
      (observation) =>
        observation.firstContactMinutes !== null,
    );


  const soldLeadAnalytics =
    buildSoldLeadAnalytics(soldClosed);

  const emailEngagement =
    buildEmailEngagementAnalysis(dataset);

  const firstResponse =
    buildFirstResponseAnalysis(observations);

  const medianFirstContactMinutes = median(
    validFirstContactTimes.map(
      (observation) =>
        observation.firstContactMinutes as number,
    ),
  );

  const medianResponseMinutes = median(
    responded.map(
      (observation) =>
        observation.responseMinutes as number,
    ),
  );

  return {
    acquisition: {
      leads: totalLeads,
      timelineCovered,
      timelineCoverageRate: ratio(
        timelineCovered,
        totalLeads,
      ),
      unknownSource: dataset.leads.filter(
        (lead) => !lead.source.trim(),
      ).length,
      sourceGroups: new Set(
        dataset.leads.map(
          (lead) =>
            lead.sourceGroup.trim() ||
            "Unknown",
        ),
      ).size,
    },

    contact: {
      contacted: contacted.length,
      notContacted:
        totalLeads - contacted.length,
      contactRate: ratio(
        contacted.length,
        totalLeads,
      ),
      medianFirstContactMinutes,
      validFirstContactTimes:
        validFirstContactTimes.length,
      contactSpeed:
        buildContactSpeedRows(
          contacted,
          validFirstContactTimes.length,
        ),
    },

    engagement: {
      contacted: contacted.length,
      responseEligible: responseEligible.length,
      responseEvidenceCoverageRate: ratio(
        responseEligible.length,
        contacted.length,
      ),
      responded: responded.length,
      responseRate: ratio(
        responded.length,
        responseEligible.length,
      ),
      respondedWithin24h:
        respondedWithin24h.length,
      responseWithin24hRate: ratio(
        respondedWithin24h.length,
        responseEligible.length,
      ),
      medianResponseMinutes,
      speed: buildResponseSpeedRows(
        contacted,
      ),
      channels: buildChannelRows(
        contacted,
      ),
      email: emailEngagement,
      firstResponse,
    },

    soldLeadAnalytics,

    progression: {
      appointmentEvidence:
        appointmentEvidence.length,
      appointmentRateOfAll: ratio(
        appointmentEvidence.length,
        totalLeads,
      ),
      appointmentRateOfContacted: ratio(
        contactedAppointmentEvidence.length,
        contacted.length,
      ),
      appointmentRateOfResponded: ratio(
        respondedAppointmentEvidence.length,
        responded.length,
      ),
      soldClosed: soldClosed.length,
      soldClosedRateOfAll: ratio(
        soldClosed.length,
        totalLeads,
      ),
      soldClosedRateOfContacted: ratio(
        contactedSoldClosed.length,
        contacted.length,
      ),
      soldClosedWithTimeline:
        soldClosed.filter(
          (observation) =>
            observation.lead.timelineRecordIds
              .length > 0,
        ).length,
      soldClosedWithoutTimeline:
        soldClosed.filter(
          (observation) =>
            observation.lead.timelineRecordIds
              .length === 0,
        ).length,
    },

    sources: buildSourceRows(
      dataset,
      observations,
    ),

    trends: buildTrendRows(
      observations,
    ),

    investigation:
      buildInvestigationRows(
        observations,
      ),
  };
}

function buildContactSpeedRows(
  contacted: ReturnType<
    typeof buildLeadObservations
  >,
  validCount: number,
): ContactSpeedRow[] {
  return CONTACT_SPEED_BUCKETS.map(
    (bucket) => {
      const count = contacted.filter(
        (observation) =>
          contactSpeedBucket(
            observation.firstContactMinutes,
          ) === bucket.key,
      ).length;

      return {
        key: bucket.key,
        label: bucket.label,
        contacted: count,
        rate:
          bucket.key === "unknown"
            ? null
            : ratio(
                count,
                validCount,
              ),
      };
    },
  );
}

function buildResponseSpeedRows(
  contacted: ReturnType<
    typeof buildLeadObservations
  >,
): ResponseSpeedRow[] {
  const responseEligible = contacted.filter(
    (observation) =>
      observation.lead.timelineRecordIds.length > 0,
  );

  return RESPONSE_SPEED_BUCKETS.map(
    (bucket) => {
      const rows = responseEligible.filter(
        (observation) =>
          responseSpeedBucket(
            observation.responseMinutes,
          ) === bucket.key,
      );

      return {
        key: bucket.key,
        label: bucket.label,
        contacted: rows.length,
        responded: rows.filter(
          (observation) =>
            observation.responseMinutes !== null,
        ).length,
        responseRate: ratio(
          rows.filter(
            (observation) =>
              observation.responseMinutes !== null,
          ).length,
          rows.length,
        ),
        appointmentEvidence:
          rows.filter(
            (observation) =>
              observation.appointmentEvidence,
          ).length,
        appointmentRate: ratio(
          rows.filter(
            (observation) =>
              observation.appointmentEvidence,
          ).length,
          rows.length,
        ),
        soldClosed:
          rows.filter(
            (observation) =>
              observation.soldClosed,
          ).length,
        soldClosedRate: ratio(
          rows.filter(
            (observation) =>
              observation.soldClosed,
          ).length,
          rows.length,
        ),
      };
    },
  );
}

function buildChannelRows(
  contacted: ReturnType<
    typeof buildLeadObservations
  >,
): ChannelRow[] {
  const responseEligible = contacted.filter(
    (observation) =>
      observation.lead.timelineRecordIds.length > 0,
  );

  const channels = [
    "text",
    "email",
    "phone",
    "voicemail",
  ] as const;

  return channels.map((channel) => {
    const rows = responseEligible.filter(
      (observation) =>
        observation.firstOutbound?.channel ===
        channel,
    );

    const responded = rows.filter(
      (observation) =>
        observation.responseMinutes !== null,
    );

    const respondedWithin24h =
      rows.filter(
        (observation) =>
          observation.respondedWithin24h,
      );

    return {
      channel,
      contacted: rows.length,
      responded: responded.length,
      responseRate: ratio(
        responded.length,
        rows.length,
      ),
      respondedWithin24h:
        respondedWithin24h.length,
      responseWithin24hRate: ratio(
        respondedWithin24h.length,
        rows.length,
      ),
    };
  });
}

function buildSourceRows(
  dataset: AnalyticsDataset,
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): SourceRow[] {
  const observationByLead = new Map(
    observations.map((observation) => [
      observation.lead.leadId,
      observation,
    ]),
  );

  const groups = new Map<
    string,
    typeof dataset.leads
  >();

  for (const lead of dataset.leads) {
    const source =
      lead.source.trim() || "Unknown";

    const existing = groups.get(source);

    if (existing) {
      existing.push(lead);
    } else {
      groups.set(source, [lead]);
    }
  }

  return [...groups.entries()]
    .map(([source, leads]) => {
      const rows = leads
        .map((lead) =>
          observationByLead.get(
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

      const contacted = rows.filter(
        (row) =>
          row.firstContactedTime !== null,
      );

      const responseEligible = contacted.filter(
        (row) =>
          row.lead.timelineRecordIds.length > 0,
      );

      const responded = responseEligible.filter(
        (row) =>
          row.responseMinutes !== null,
      );

      const respondedWithin24h =
        responseEligible.filter(
          (row) =>
            row.respondedWithin24h,
        );

      const appointments = contacted.filter(
        (row) =>
          row.appointmentEvidence,
      );

      const sold = rows.filter(
        (row) =>
          row.soldClosed,
      );

      const firstContactTimes =
        contacted
          .map(
            (row) =>
              row.firstContactMinutes,
          )
          .filter(
            (value): value is number =>
              value !== null,
          );

      return {
        source,
        sourceGroup:
          mostCommonSourceGroup(leads),
        leads: leads.length,
        mixRate: ratio(
          leads.length,
          dataset.leads.length,
        ),
        timelineCovered:
          leads.filter(
            (lead) =>
              lead.timelineRecordIds
                .length > 0,
          ).length,
        timelineCoverageRate: ratio(
          leads.filter(
            (lead) =>
              lead.timelineRecordIds
                .length > 0,
          ).length,
          leads.length,
        ),
        contacted: contacted.length,
        contactRate: ratio(
          contacted.length,
          leads.length,
        ),
        medianFirstContactMinutes:
          median(firstContactTimes),
        responded: responded.length,
        responseRate: ratio(
          responded.length,
          responseEligible.length,
        ),
        respondedWithin24h:
          respondedWithin24h.length,
        responseWithin24hRate: ratio(
          respondedWithin24h.length,
          responseEligible.length,
        ),
        appointmentEvidence:
          appointments.length,
        appointmentRate: ratio(
          appointments.length,
          contacted.length,
        ),
        soldClosed: sold.length,
        soldClosedRate: ratio(
          sold.length,
          leads.length,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.leads - left.leads ||
        left.source.localeCompare(
          right.source,
        ),
    );
}

function mostCommonSourceGroup(
  leads: AnalyticsDataset["leads"],
): string {
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const group =
      lead.sourceGroup.trim() ||
      "Unknown";

    counts.set(
      group,
      (counts.get(group) ?? 0) + 1,
    );
  }

  return [...counts.entries()].sort(
    (left, right) =>
      right[1] - left[1] ||
      left[0].localeCompare(right[0]),
  )[0]?.[0] ?? "Unknown";
}

function buildTrendRows(
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): TrendRow[] {
  const groups = new Map<
    string,
    ReturnType<
      typeof buildLeadObservations
    >
  >();

  for (const observation of observations) {
    const created = observation.lead.creationTime;

    if (!created) {
      continue;
    }

    const date = new Date(created);

    if (Number.isNaN(date.getTime())) {
      continue;
    }

    const month = [
      date.getUTCFullYear(),
      String(date.getUTCMonth() + 1).padStart(
        2,
        "0",
      ),
    ].join("-");

    const existing = groups.get(month);

    if (existing) {
      existing.push(observation);
    } else {
      groups.set(month, [observation]);
    }
  }

  return [...groups.entries()]
    .sort(([left], [right]) =>
      left.localeCompare(right),
    )
    .map(([month, rows]) => {
      const contacted = rows.filter(
        (row) =>
          row.firstContactedTime !== null,
      );

      const responseEligible = contacted.filter(
        (row) =>
          row.lead.timelineRecordIds.length > 0,
      );

      const responded = responseEligible.filter(
        (row) =>
          row.responseMinutes !== null,
      );

      const appointments = contacted.filter(
        (row) =>
          row.appointmentEvidence,
      );

      const sold = rows.filter(
        (row) =>
          row.soldClosed,
      );

      return {
        month,
        label: formatMonth(month),
        leads: rows.length,
        contacted: contacted.length,
        contactRate: ratio(
          contacted.length,
          rows.length,
        ),
        responded: responded.length,
        responseRate: ratio(
          responded.length,
          responseEligible.length,
        ),
        appointmentEvidence:
          appointments.length,
        appointmentRate: ratio(
          appointments.length,
          contacted.length,
        ),
        soldClosed: sold.length,
        soldClosedRate: ratio(
          sold.length,
          rows.length,
        ),
      };
    });
}

function buildInvestigationRows(
  observations: ReturnType<
    typeof buildLeadObservations
  >,
): InvestigationRow[] {
  return [...observations]
    .sort((left, right) => {
      const leftPriority =
        Number(left.firstContactedTime === null) +
        Number(
          left.responseMinutes === null,
        );

      const rightPriority =
        Number(right.firstContactedTime === null) +
        Number(
          right.responseMinutes === null,
        );

      return (
        rightPriority - leftPriority ||
        left.lead.source.localeCompare(
          right.lead.source,
        )
      );
    })
    .map((observation) => ({
      leadId:
        observation.lead.leadId,
      contactName:
        observation.lead.contactName ||
        "Unnamed lead",
      source:
        observation.lead.source.trim() ||
        "Unknown",
      sourceGroup:
        observation.lead.sourceGroup.trim() ||
        "Unknown",
      stage:
        observation.lead.stage.trim() ||
        "Unknown",
      createdAt:
        observation.lead.creationTime,
      timelineCovered:
        observation.lead.timelineRecordIds
          .length > 0,
      firstContactAt:
        observation.firstContactedTime,
      firstContactMinutes:
        observation.firstContactMinutes,
      firstContactChannel:
        observation.firstOutbound?.channel ??
        null,
      firstAction:
        observation.firstAction?.actionType ??
        null,
      firstTemplate:
        observation.firstAction?.template ??
        null,
      responseAt:
        observation.firstInbound
          ?.occurredAt ?? null,
      responseMinutes:
        observation.responseMinutes,
      appointmentEvidence:
        observation.appointmentEvidence,
      soldClosed:
        observation.soldClosed,
    }));
}

function ratio(
  numerator: number,
  denominator: number,
): number | null {
  return denominator === 0
    ? null
    : numerator / denominator;
}

function formatMonth(
  value: string,
): string {
  const [year, month] =
    value.split("-").map(Number);

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    },
  ).format(
    new Date(
      Date.UTC(year, month - 1, 1),
    ),
  );
}


function buildSoldLeadAnalytics(
  soldRows: ReturnType<typeof buildLeadObservations>,
): SoldLeadAnalytics {
  const contacted = soldRows.filter(
    (row) => row.firstContactedTime !== null,
  );

  const responseEligible = contacted.filter(
    (row) => row.lead.timelineRecordIds.length > 0,
  );

  const responded = responseEligible.filter(
    (row) => row.responseMinutes !== null,
  );

  const firstContactTimes = contacted
    .map((row) => row.firstContactMinutes)
    .filter(
      (value): value is number =>
        value !== null,
    );

  const responseTimes = responded
    .map((row) => row.responseMinutes)
    .filter(
      (value): value is number =>
        value !== null,
    );

  const attempts = responded
    .map(
      (row) =>
        row.outboundAttemptsBeforeResponse,
    )
    .filter(
      (value): value is number =>
        value !== null,
    );

  const timelineCovered = soldRows.filter(
    (row) => row.lead.timelineRecordIds.length > 0,
  ).length;

  return {
    soldClosed: soldRows.length,
    timelineCovered,
    timelineCoverageRate: ratio(
      timelineCovered,
      soldRows.length,
    ),
    contacted: contacted.length,
    responded: responded.length,

    averageFirstContactMinutes:
      average(firstContactTimes),
    medianFirstContactMinutes:
      median(firstContactTimes),

    averageFirstResponseMinutes:
      average(responseTimes),
    medianFirstResponseMinutes:
      median(responseTimes),

    respondedWithin24h:
      responseEligible.filter(
        (row) => row.respondedWithin24h,
      ).length,

    responseWithin24hRate: ratio(
      responseEligible.filter(
        (row) => row.respondedWithin24h,
      ).length,
      responseEligible.length,
    ),

    averageOutboundBeforeResponse:
      average(attempts),

    firstActions:
      buildActionRows(soldRows),

    responseActions:
      buildResponseActionRows(soldRows),

    templates:
      buildTemplateRows(soldRows),
  };
}

function buildActionRows(
  observations: ReturnType<typeof buildLeadObservations>,
): ActionRow[] {
  const groups = new Map<
    string,
    ReturnType<typeof buildLeadObservations>
  >();

  for (const observation of observations) {
    const action = observation.firstAction;

    if (!action) {
      continue;
    }

    const key = [
      action.actionType,
      action.channel ?? "none",
    ].join("|");

    const existing = groups.get(key);

    if (existing) {
      existing.push(observation);
    } else {
      groups.set(key, [observation]);
    }
  }

  return [...groups.entries()]
    .map(([key, rows]) => {
      const [action, channel] =
        key.split("|");

      const responded = rows.filter(
        (row) =>
          row.responseMinutes !== null,
      );

      const responseTimes = responded
        .map((row) => row.responseMinutes)
        .filter(
          (value): value is number =>
            value !== null,
        );

      const appointments =
        rows.filter(
          (row) =>
            row.appointmentEvidence,
        );

      return {
        action,
        channel:
          channel === "none"
            ? null
            : channel,
        contacted: rows.length,
        responded: responded.length,
        responseRate: ratio(
          responded.length,
          rows.length,
        ),
        averageResponseMinutes:
          average(responseTimes),
        medianResponseMinutes:
          median(responseTimes),
        appointmentEvidence:
          appointments.length,
        appointmentRate: ratio(
          appointments.length,
          rows.length,
        ),
        soldClosed: rows.filter(
          (row) => row.soldClosed,
        ).length,
        soldClosedRate: ratio(
          rows.filter(
            (row) => row.soldClosed,
          ).length,
          rows.length,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.contacted - left.contacted ||
        left.action.localeCompare(
          right.action,
        ),
    );
}

function buildResponseActionRows(
  observations: ReturnType<typeof buildLeadObservations>,
): ResponseActionRow[] {
  const groups = new Map<
    string,
    ReturnType<typeof buildLeadObservations>
  >();

  for (const observation of observations) {
    const action = observation.responseAction;

    if (!action || observation.responseMinutes === null) {
      continue;
    }

    const key = [
      action.actionType,
      action.channel ?? "none",
    ].join("|");

    const existing = groups.get(key);

    if (existing) {
      existing.push(observation);
    } else {
      groups.set(key, [observation]);
    }
  }

  return [...groups.entries()]
    .map(([key, rows]) => {
      const [action, channel] = key.split("|");

      const responseTimes = rows
        .map((row) => row.responseMinutes)
        .filter(
          (value): value is number =>
            value !== null,
        );

      const appointments = rows.filter(
        (row) => row.appointmentEvidence,
      );

      return {
        action,
        channel:
          channel === "none"
            ? null
            : channel,
        responses: rows.length,
        averageResponseMinutes:
          average(responseTimes),
        medianResponseMinutes:
          median(responseTimes),
        appointmentEvidence:
          appointments.length,
        appointmentRate: ratio(
          appointments.length,
          rows.length,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.responses - left.responses ||
        left.action.localeCompare(right.action),
    );
}

function buildTemplateRows(
  observations: ReturnType<typeof buildLeadObservations>,
): TemplateRow[] {
  const groups = new Map<
    string,
    {
      source: string;
      observations: ReturnType<typeof buildLeadObservations>;
      uses: number;
    }
  >();

  for (const observation of observations) {
    for (const action of observation.templateActions) {
      if (!action.template) {
        continue;
      }

      const key = [
        action.templateSource,
        action.template,
      ].join("|");

      const existing = groups.get(key);

      if (existing) {
        existing.observations.push(
          observation,
        );
        existing.uses += 1;
      } else {
        groups.set(key, {
          source:
            action.templateSource,
          observations: [observation],
          uses: 1,
        });
      }
    }
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const [, template] =
        key.split("|");

      const uniqueObservations = [
        ...new Map(
          group.observations.map(
            (row) => [
              row.lead.leadId,
              row,
            ],
          ),
        ).values(),
      ];

      const responded =
        uniqueObservations.filter(
          (row) =>
            row.responseMinutes !== null,
        );

      const responseTimes =
        responded
          .map(
            (row) =>
              row.responseMinutes,
          )
          .filter(
            (value): value is number =>
              value !== null,
          );

      const appointments =
        uniqueObservations.filter(
          (row) =>
            row.appointmentEvidence,
        );

      const sold =
        uniqueObservations.filter(
          (row) =>
            row.soldClosed,
        );

      return {
        template,
        templateSource: group.source,
        uses: group.uses,
        leads: uniqueObservations.length,
        responded: responded.length,
        responseRate: ratio(
          responded.length,
          uniqueObservations.length,
        ),
        averageResponseMinutes:
          average(responseTimes),
        medianResponseMinutes:
          median(responseTimes),
        appointmentEvidence:
          appointments.length,
        appointmentRate: ratio(
          appointments.length,
          uniqueObservations.length,
        ),
        soldClosed: sold.length,
        soldClosedRate: ratio(
          sold.length,
          uniqueObservations.length,
        ),
      };
    })
    .sort(
      (left, right) =>
        right.leads - left.leads ||
        left.template.localeCompare(
          right.template,
        ),
    );
}
