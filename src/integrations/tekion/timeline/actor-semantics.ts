import type { TekionActorType } from "./normalized-timeline-event";

export function actorTypeForTimelineEvent(
  actor: string,
): TekionActorType {
  const normalized = actor.trim().toLowerCase();

  if (!normalized) {
    return "unknown";
  }

  if (normalized === "system") {
    return "system";
  }

  if (
    normalized.includes("conversica") ||
    normalized.includes("automation")
  ) {
    return "automation";
  }

  return "employee";
}
