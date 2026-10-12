import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import {
  buildLeadObservations,
  calculateElapsedMinutes,
  median,
} from "@/analytics/observations/analytics-observations";
import { findFirstInboundAfterSpecificOutbound } from "@/analytics/observations/communication-evidence";

export const DEFAULT_TEMPLATE_RESPONSE_WINDOW_MINUTES = 24 * 60;

export type TemplateActionOutcome = {
  leadId: string;
  templateCode: string;
  outboundAt: string;
  responseAt: string | null;
  responseMinutes: number | null;
  respondedWithinWindow: boolean;
};

export type TemplateResponseSummary = {
  templateCode: string;
  actionCount: number;
  respondedActions: number;
  actionsWithoutResponseWithinWindow: number;
  responseRate: number | null;
  medianResponseMinutes: number | null;
};

export type TemplateResponseAnalysis = {
  windowMinutes: number;
  totalMatchedTemplateActions: number;
  totalRespondedActions: number;
  overallResponseRate: number | null;
  medianResponseMinutes: number | null;
  byTemplate: TemplateResponseSummary[];
  actions: TemplateActionOutcome[];
};

/**
 * Analyze canonical template-coded outbound actions independently of
 * lead-level report grouping. A response is associated with an action only
 * when it occurs before the next outbound communication and within the
 * configured window. This is observational attribution, not causation.
 */
export function buildTemplateResponseAnalysis(
  dataset: AnalyticsDataset,
  windowMinutes = DEFAULT_TEMPLATE_RESPONSE_WINDOW_MINUTES,
): TemplateResponseAnalysis {
  if (!Number.isFinite(windowMinutes) || windowMinutes < 0) {
    throw new Error(
      "Template response window must be a finite, non-negative number of minutes.",
    );
  }

  const actions: TemplateActionOutcome[] = [];

  for (const observation of buildLeadObservations(dataset)) {
    for (const action of observation.templateActions) {
      const templateCode = action.templateCode?.trim();
      if (!templateCode) continue;

      const response = findFirstInboundAfterSpecificOutbound(
        observation.events,
        action.event,
      );
      const elapsed = response
        ? calculateElapsedMinutes(
            action.event.occurredAt,
            response.occurredAt,
          )
        : null;
      const respondedWithinWindow =
        response !== null &&
        elapsed !== null &&
        elapsed <= windowMinutes;

      actions.push({
        leadId: observation.lead.leadId,
        templateCode,
        outboundAt: action.event.occurredAt,
        responseAt: respondedWithinWindow
          ? response?.occurredAt ?? null
          : null,
        responseMinutes: respondedWithinWindow ? elapsed : null,
        respondedWithinWindow,
      });
    }
  }

  actions.sort(
    (a, b) =>
      Date.parse(a.outboundAt) - Date.parse(b.outboundAt) ||
      a.leadId.localeCompare(b.leadId) ||
      a.templateCode.localeCompare(b.templateCode),
  );

  const grouped = new Map<string, TemplateActionOutcome[]>();
  for (const action of actions) {
    const group = grouped.get(action.templateCode) ?? [];
    group.push(action);
    grouped.set(action.templateCode, group);
  }

  const byTemplate = [...grouped.entries()]
    .map(([code, items]) => summarizeTemplate(code, items))
    .sort((a, b) => a.templateCode.localeCompare(b.templateCode));

  const responded = actions.filter((action) => action.respondedWithinWindow);

  return {
    windowMinutes,
    totalMatchedTemplateActions: actions.length,
    totalRespondedActions: responded.length,
    overallResponseRate:
      actions.length === 0 ? null : responded.length / actions.length,
    medianResponseMinutes: median(
      responded.flatMap((action) =>
        action.responseMinutes === null ? [] : [action.responseMinutes],
      ),
    ),
    byTemplate,
    actions,
  };
}

function summarizeTemplate(
  templateCode: string,
  actions: TemplateActionOutcome[],
): TemplateResponseSummary {
  const responded = actions.filter((action) => action.respondedWithinWindow);
  const minutes = responded.flatMap((action) =>
    action.responseMinutes === null ? [] : [action.responseMinutes],
  );

  return {
    templateCode,
    actionCount: actions.length,
    respondedActions: responded.length,
    actionsWithoutResponseWithinWindow: actions.length - responded.length,
    responseRate: actions.length === 0 ? null : responded.length / actions.length,
    medianResponseMinutes: median(minutes),
  };
}
