import type { ProgressionRule, ProgressionStage } from "./progression-types";

export const DEFAULT_PROGRESSION_RULES: ProgressionRule[] = [
  {
    ruleKey: "lead-created-v1",
    stage: "new_lead",
    version: 1,
    label: "Lead created",
    description: "Canonical lead has a valid creation timestamp.",
    qualificationBasis: "source_record",
    isActive: true,
  },
  {
    ruleKey: "customer-response-v1",
    stage: "engaged",
    version: 1,
    label: "Customer engagement",
    description: "Qualifying inbound customer communication or observed connected call.",
    qualificationBasis: "observed_event",
    isActive: true,
  },
  {
    ruleKey: "two-way-interaction-v1",
    stage: "conversation",
    version: 1,
    label: "Conversation",
    description: "A subsequent two-way exchange after engagement or a later connected phone call is observed.",
    qualificationBasis: "observed_event",
    isActive: true,
  },
  {
    ruleKey: "appointment-created-v1",
    stage: "appointment",
    version: 1,
    label: "Appointment recorded",
    description: "Timeline evidence records a qualifying appointment creation.",
    qualificationBasis: "observed_event",
    isActive: true,
  },
  {
    ruleKey: "show-attendance-v1",
    stage: "show",
    version: 1,
    label: "Show attendance",
    description: "Timeline evidence explicitly supports attendance or arrival.",
    qualificationBasis: "observed_event",
    isActive: true,
  },
  {
    ruleKey: "sale-outcome-v1",
    stage: "sold",
    version: 1,
    label: "Sale outcome",
    description: "A sold date or explicit sale outcome is present in canonical source evidence.",
    qualificationBasis: "source_outcome",
    isActive: true,
  },
];

export const TRANSITION_PAIRS: Array<[ProgressionStage, ProgressionStage]> = [
  ["new_lead", "engaged"],
  ["engaged", "conversation"],
  ["conversation", "appointment"],
  ["appointment", "show"],
  ["show", "sold"],
];

export function activeRulesForStage(
  rules: ProgressionRule[],
  stage: ProgressionStage,
): ProgressionRule[] {
  return rules.filter((rule) => rule.isActive && rule.stage === stage);
}
