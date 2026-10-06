import type { AnalyticsEvent } from "@/analytics/data/analytics-types";

export type EmailEvidence = {
  event: AnalyticsEvent;
  templateCode: string | null;
  opens: number;
  clicks: number;
  opened: boolean;
  firstInbound: AnalyticsEvent | null;
  firstInboundChannel: string | null;
  firstInboundMinutes: number | null;
};

const EMAIL_SENT_TYPES = new Set(["Email Sent"]);

const EMAIL_EVIDENCE_PATTERN =
  /(?:^|\n)\s*(\d+)\s+Open(?:s)?\s+(\d+)\s+Clicks?/i;

export function isEmailSent(
  event: AnalyticsEvent,
): boolean {
  return (
    EMAIL_SENT_TYPES.has(event.rawType) &&
    event.channel === "email" &&
    event.direction === "outbound"
  );
}

export function parseEmailEvidence(
  event: AnalyticsEvent,
): {
  opens: number;
  clicks: number;
} {
  if (!isEmailSent(event)) {
    return {
      opens: 0,
      clicks: 0,
    };
  }

  const match =
    event.details.match(EMAIL_EVIDENCE_PATTERN);

  if (!match) {
    return {
      opens: 0,
      clicks: 0,
    };
  }

  return {
    opens: Number(match[1]),
    clicks: Number(match[2]),
  };
}

export function buildEmailEvidence(
  events: AnalyticsEvent[],
): EmailEvidence[] {
  const ordered = [...events].sort(
    (left, right) =>
      Date.parse(left.occurredAt) -
      Date.parse(right.occurredAt),
  );

  return ordered
    .filter(isEmailSent)
    .map((event) => {
      const evidence = parseEmailEvidence(event);
      const firstInbound =
        findFirstInboundAfterEmail(
          ordered,
          event,
        );

      return {
        event,
        templateCode:
          event.templateCode ??
          null,
        opens: evidence.opens,
        clicks: evidence.clicks,
        opened: evidence.opens > 0,
        firstInbound,
        firstInboundChannel:
          firstInbound?.channel ?? null,
        firstInboundMinutes:
          firstInbound
            ? elapsedMinutes(
                event.occurredAt,
                firstInbound.occurredAt,
              )
            : null,
      };
    });
}

function findFirstInboundAfterEmail(
  events: AnalyticsEvent[],
  email: AnalyticsEvent,
): AnalyticsEvent | null {
  const emailTime = Date.parse(
    email.occurredAt,
  );

  if (!Number.isFinite(emailTime)) {
    return null;
  }

  for (const event of events) {
    const eventTime = Date.parse(
      event.occurredAt,
    );

    if (
      !Number.isFinite(eventTime) ||
      eventTime <= emailTime
    ) {
      continue;
    }

    /*
     * Once another employee outbound occurs, we no longer attribute
     * a later inbound to this specific email.
     *
     * This deliberately keeps email attribution conservative.
     */
    if (
      event.category === "communication" &&
      event.direction === "outbound"
    ) {
      return null;
    }

    if (
      event.category === "communication" &&
      event.direction === "inbound"
    ) {
      return event;
    }
  }

  return null;
}

function elapsedMinutes(
  startAt: string,
  endAt: string,
): number | null {
  const start = Date.parse(startAt);
  const end = Date.parse(endAt);

  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    end < start
  ) {
    return null;
  }

  return (end - start) / 60000;
}
