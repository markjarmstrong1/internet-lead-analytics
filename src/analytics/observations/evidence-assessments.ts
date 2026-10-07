import type { EvidenceAssessment } from "@/analytics/definitions/evidence-state";

export type ObservationEvidenceAssessments = {
  contact: EvidenceAssessment;
  outbound: EvidenceAssessment;
  response: EvidenceAssessment;
  appointment: EvidenceAssessment;
  outcome: EvidenceAssessment;
};

export function buildEvidenceAssessments(input: {
  hasTimelineEvents: boolean;
  firstContactedTime: string | null;
  firstOutbound: unknown | null;
  firstInbound: unknown | null;
  appointmentAt: string | null;
  soldClosed: boolean;
}): ObservationEvidenceAssessments {
  const {
    hasTimelineEvents,
    firstContactedTime,
    firstOutbound,
    firstInbound,
    appointmentAt,
    soldClosed,
  } = input;

  return {
    contact:
      firstContactedTime !== null
        ? {
            state: "observed",
            reason: "CRM First Contacted Time is present.",
          }
        : {
            state: "unknown",
            reason:
              "CRM First Contacted Time is missing; absence of the field does not prove that contact did not occur.",
          },

    outbound:
      firstOutbound !== null
        ? {
            state: "observed",
            reason:
              "At least one qualifying employee outbound communication was observed in timeline evidence.",
          }
        : hasTimelineEvents
          ? {
              state: "not_observed",
              reason:
                "Timeline evidence was available, but no qualifying employee outbound communication was observed.",
            }
          : {
              state: "insufficient_evidence",
              reason:
                "No timeline events were available to assess qualifying outbound communication.",
            },

    response:
      firstInbound !== null
        ? {
            state: "observed",
            reason:
              "At least one qualifying inbound communication was observed after outbound exposure.",
          }
        : firstOutbound === null
          ? {
              state: "insufficient_evidence",
              reason:
                "No qualifying outbound exposure was observed, so response cannot be meaningfully assessed.",
            }
          : hasTimelineEvents
            ? {
                state: "not_observed",
                reason:
                  "Outbound exposure was observed, but no qualifying inbound response was observed afterward.",
              }
            : {
                state: "insufficient_evidence",
                reason:
                  "No timeline evidence was available to assess response after outbound exposure.",
              },

    appointment:
      appointmentAt !== null
        ? {
            state: "observed",
            reason: "Qualifying appointment evidence was observed.",
          }
        : hasTimelineEvents
          ? {
              state: "not_observed",
              reason:
                "Timeline evidence was available, but no qualifying appointment evidence was observed.",
            }
          : {
              state: "insufficient_evidence",
              reason:
                "No timeline events were available to assess appointment evidence.",
            },

    outcome:
      soldClosed
        ? {
            state: "observed",
            reason:
              "The CRM lead stage indicates a Sold or Closed outcome.",
          }
        : {
            state: "not_observed",
            reason:
              "The current CRM lead stage does not indicate a Sold or Closed outcome.",
          },
  };
}
