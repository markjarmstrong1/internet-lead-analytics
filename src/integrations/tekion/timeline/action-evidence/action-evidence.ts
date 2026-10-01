import type { TekionCommunicationChannel } from "../normalized-timeline-event";

export type TekionActionEvidenceReason =
  | "outbound_employee_communication"
  | "inbound_customer_communication"
  | "unknown_communication_direction"
  | "automation_or_system_activity"
  | "workflow_activity"
  | "lifecycle_activity"
  | "assignment_activity"
  | "vehicle_activity"
  | "trade_activity"
  | "deal_activity"
  | "pricing_activity"
  | "note_activity"
  | "visit_activity"
  | "other_activity";

export type TekionActionEvidence = {
  qualifiesAsEmployeeAction: boolean;
  channel?: TekionCommunicationChannel;
  reason: TekionActionEvidenceReason;
};
