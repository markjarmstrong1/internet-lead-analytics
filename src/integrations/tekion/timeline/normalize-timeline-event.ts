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
    case "Missed Call":
    case "Call Attempt":
      return "communication";

    case "Engaged Lead Follow Up":
    case "Day 1 Internet Lead Tasking - Call":
    case "Day 2 Internet Lead Tasking - Call":
    case "Day 3 Internet Lead Tasking - Call":
    case "Day 5 Internet Lead Tasking - Touch":
    case "Day 7 Internet Lead Tasking - Touch":
    case "Day 11 Internet Lead Tasking - Touch":
    case "Day 15 Internet Lead Tasking - Touch":
    case "Day 19 Internet Lead Tasking - Touch":
    case "Day 23 Internet Lead Tasking - Touch":
    case "New Internet Lead - Immediate Follow Up Email":
    case "New Internet Lead - Immediate Follow Up Text":
    case "New Internet Lead - Immediate Follow Up Call":
    case "Completed":
      return "task";

    case "Stage Changed":
    case "Status Changed":
    case "Lead Created":
      return "lifecycle";

    case "Salesperson Assigned":
    case "Salesperson 2 Assigned":
    case "Sales Manager Assigned":
    case "BDC Specialist Assigned":
      return "assignment";

    case "Vehicle Interest Added":
    case "Primary Vehicle Interest Updated":
      return "vehicle";

    case "Trade-in Added":
    case "Trade-in Updated":
      return "trade";

    case "Deal Created":
    case "Deal Sheet":
    case "Deal Updated":
      return "deal";

    case "Conversica Message":
    case "Conversica Lead Response":
    case "Sent Campaign Email":
      return "automation";

    case "Note":
    case "Customer Comments":
    case "Customer Comment":
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
