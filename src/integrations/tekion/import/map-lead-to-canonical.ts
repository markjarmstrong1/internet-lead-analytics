import type { TekionLeadRecord } from "../csv/lead-record";

export type CanonicalLeadInput = {
  source: string;
  productInterest: string;
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  status: string;
  stage: string;
};

export function mapLeadToCanonical(
  lead: TekionLeadRecord,
): CanonicalLeadInput {
  return {
    source: lead.source,
    productInterest: lead.vehicleInterest,
    vehicleYear: lead.year,
    vehicleMake: lead.make,
    vehicleModel: lead.model,
    status: lead.status,
    stage: lead.stage,
  };
}