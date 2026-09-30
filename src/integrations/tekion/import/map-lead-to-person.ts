import type { TekionLeadRecord } from "../csv/lead-record";

export type CanonicalPersonInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export function mapLeadToPerson(
  lead: TekionLeadRecord,
): CanonicalPersonInput {
  const nameParts = lead.contactName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ");

  return {
    firstName,
    lastName,
    email: lead.email,
    phone: lead.mobilePhone || lead.homePhone || lead.workPhone,
  };
}