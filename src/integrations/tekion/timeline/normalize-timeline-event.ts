import type {
  TekionTimelineEvent,
  TekionTimelineEventCategory,
} from "./timeline-event";

function categoryForType(
  rawType: string,
): TekionTimelineEventCategory {
  switch (rawType) {
    case "Email Sent":
    case "Email Received":
    case "Text Sent":
    case "Text Received":
    case "Outbound Call":
    case "Inbound Call":
    case "Outbound Voicemail":
    case "Call Back":
      return "communication";

    case "Engaged Lead Follow Up":
      return "task";

    case "Stage Changed":
    case "Status Changed":
      return "lifecycle";

    case "Salesperson Assigned":
    case "Salesperson 2 Assigned":
    case "Sales Manager Assigned":
      return "assignment";

    case "Vehicle Interest Added":
    case "Primary Vehicle Interest Updated":
      return "vehicle";

    case "Trade-in Added":
    case "Trade-in Updated":
      return "trade";

    case "Deal Created":
    case "Deal Sheet":
      return "deal";

    case "Conversica Message":
    case "Conversica Lead Response":
      return "automation";

    case "Note":
    case "Customer Comments":
      return "note";

    case "checkin":
    case "Check-in":
    case "Check-out":
    case "Viewed Concierge":
    case "Concierge Shared":
      return "visit";

    default:
      return "other";
  }
}

export function normalizeTimelineEvent(
  event: TekionTimelineEvent,
): TekionTimelineEvent {
  return {
    ...event,
    category: categoryForType(event.rawType),
  };
}
