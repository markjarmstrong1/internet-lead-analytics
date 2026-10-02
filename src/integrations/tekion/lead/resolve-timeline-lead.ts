import type { LeadPersistenceRow } from "./lead-persistence-row";

type LeadIdentity = {
  id: string;
  contactName: string;
};

export type TimelineLeadResolution = {
  leadId: string | null;
  status: "matched" | "ambiguous" | "unresolved";
};

function normalizeName(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function nameTokens(value: string): string[] {
  return normalizeName(value)
    .split(" ")
    .filter(Boolean);
}

function namesMatch(
  timelineName: string,
  leadName: string,
): boolean {
  const timelineTokens = nameTokens(timelineName);
  const leadTokens = nameTokens(leadName);

  if (timelineTokens.length === 0 || leadTokens.length === 0) {
    return false;
  }

  if (timelineTokens.join(" ") === leadTokens.join(" ")) {
    return true;
  }

  /*
   * Some Tekion contact names contain a middle name that is absent
   * from the timeline filename.
   *
   * Example:
   *   William Glasgow
   *   William NEWTON Glasgow
   *
   * Require every timeline token to occur in the canonical lead name.
   * This avoids arbitrary fuzzy matching.
   */
  return timelineTokens.every((token) =>
    leadTokens.includes(token),
  );
}

export function resolveTimelineLead(
  timelineSourceFile: string | null | undefined,
  leads: Array<LeadIdentity | LeadPersistenceRow>,
): TimelineLeadResolution {
  if (!timelineSourceFile) {
    return {
      leadId: null,
      status: "unresolved",
    };
  }

  const fileName = timelineSourceFile
    .split("/")
    .pop()
    ?.replace(/\.(docx|txt)$/i, "")
    .replace(/_/g, " ")
    .trim();

  if (!fileName) {
    return {
      leadId: null,
      status: "unresolved",
    };
  }

  const matches = leads.filter((lead) =>
    namesMatch(fileName, lead.contactName),
  );

  if (matches.length === 1) {
    return {
      leadId: matches[0].id,
      status: "matched",
    };
  }

  if (matches.length > 1) {
    return {
      leadId: null,
      status: "ambiguous",
    };
  }

  return {
    leadId: null,
    status: "unresolved",
  };
}