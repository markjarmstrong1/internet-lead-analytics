import type { TekionNormalizedTimelineEvent } from "../normalized-timeline-event";
import type { TekionActionEvidence } from "./action-evidence";

export function classifyActionEvidence(
  event: TekionNormalizedTimelineEvent,
): TekionActionEvidence {
  if (event.communicationChannel) {
    if (
      event.actorType === "employee" &&
      event.communicationDirection === "outbound"
    ) {
      return {
        qualifiesAsEmployeeAction: true,
        channel: event.communicationChannel,
        reason: "outbound_employee_communication",
      };
    }

    if (event.communicationDirection === "inbound") {
      return {
        qualifiesAsEmployeeAction: false,
        channel: event.communicationChannel,
        reason: "inbound_customer_communication",
      };
    }

    return {
      qualifiesAsEmployeeAction: false,
      channel: event.communicationChannel,
      reason: "unknown_communication_direction",
    };
  }

  switch (event.category) {
    case "task":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "workflow_activity",
      };

    case "lifecycle":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "lifecycle_activity",
      };

    case "assignment":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "assignment_activity",
      };

    case "vehicle":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "vehicle_activity",
      };

    case "trade":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "trade_activity",
      };

    case "deal":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "deal_activity",
      };

    case "pricing":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "pricing_activity",
      };

    case "automation":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "automation_or_system_activity",
      };

    case "note":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "note_activity",
      };

    case "visit":
      return {
        qualifiesAsEmployeeAction: false,
        reason: "visit_activity",
      };

    default:
      return {
        qualifiesAsEmployeeAction: false,
        reason: "other_activity",
      };
  }
}
