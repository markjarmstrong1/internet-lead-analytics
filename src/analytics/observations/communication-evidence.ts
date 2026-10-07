import type { AnalyticsEvent } from "@/analytics/data/analytics-types";

export function isEmployeeOutboundCommunication(
  event: AnalyticsEvent,
): boolean {
  return (
    event.category === "communication" &&
    event.actorType === "employee" &&
    event.direction === "outbound" &&
    event.channel !== null
  );
}

export function findFirstInboundCommunication(
  events: AnalyticsEvent[],
  exposureAt: string,
): AnalyticsEvent | null {
  const exposureTime = Date.parse(exposureAt);

  if (!Number.isFinite(exposureTime)) {
    return null;
  }

  for (const event of events) {
    const eventTime = Date.parse(event.occurredAt);

    if (
      !Number.isFinite(eventTime) ||
      eventTime < exposureTime
    ) {
      continue;
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

export function findFirstInboundAfterSpecificOutbound(
  events: AnalyticsEvent[],
  outbound: AnalyticsEvent,
): AnalyticsEvent | null {
  const outboundTime = Date.parse(outbound.occurredAt);

  if (!Number.isFinite(outboundTime)) {
    return null;
  }

  for (const event of events) {
    const eventTime = Date.parse(event.occurredAt);

    if (
      !Number.isFinite(eventTime) ||
      eventTime <= outboundTime
    ) {
      continue;
    }

    /*
     * A later outbound starts a new exposure boundary.
     * An inbound after that boundary belongs to the later
     * exposure rather than this specific outbound.
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
