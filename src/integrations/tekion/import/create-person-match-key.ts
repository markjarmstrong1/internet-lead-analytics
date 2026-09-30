import type { TekionLeadRecord } from "../csv/lead-record";

export type PersonMatchKey = {
  email: string;
  phone: string;
};

export function createPersonMatchKey(
  lead: TekionLeadRecord,
): PersonMatchKey {
  return {
    email: lead.email.trim().toLowerCase(),
    phone: lead.mobilePhone.trim(),
  };
}