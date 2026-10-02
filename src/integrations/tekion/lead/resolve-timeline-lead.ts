import type { LeadPersistenceRow } from "./lead-persistence-row";

export type TimelineLeadIdentity = {
  externalRecordId: string;
  contactName: string;
};

export type TimelineLeadResolution = {
  externalRecordId: string | null;
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
   * Tekion can contain a middle name that is absent from the
   * timeline filename.
   *
   * Example:
   *   William Glasgow
   *   William NEWTON Glasgow
   *
   * Every filename token must occur in the canonical lead name.
   * This is intentionally deterministic rather than fuzzy.
   */
  return timelineTokens.every((token) =>
    leadTokens.includes(token),
  );
}

function toLeadIdentity(
  lead: TimelineLeadIdentity | LeadPersistenceRow,
): TimelineLeadIdentity | null {
  if ("externalRecordId" in lead) {
    return lead.externalRecordId
      ? lead
      : null;
  }

  return lead.external_record_id
    ? {
        externalRecordId: lead.external_record_id,
        contactName: lead.contact_name,
      }
    : null;
}

export function resolveTimelineLead(
  timelineSourceFile: string | null | undefined,
  leads: Array<TimelineLeadIdentity | LeadPersistenceRow>,
): TimelineLeadResolution {
  if (!timelineSourceFile) {
    return {
      externalRecordId: null,
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
      externalRecordId: null,
      status: "unresolved",
    };
  }

  const identities = leads
    .map(toLeadIdentity)
    .filter(
      (lead): lead is TimelineLeadIdentity =>
        lead !== null,
    );

  const matches = identities.filter((lead) =>
    namesMatch(fileName, lead.contactName),
  );

  if (matches.length === 1) {
    return {
      externalRecordId: matches[0].externalRecordId,
      status: "matched",
    };
  }

  if (matches.length > 1) {
    return {
      externalRecordId: null,
      status: "ambiguous",
    };
  }

  return {
    externalRecordId: null,
    status: "unresolved",
  };
}