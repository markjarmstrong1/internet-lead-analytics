import { describe, expect, it } from "vitest";
import { mapLeadToCanonical } from "../../src/integrations/tekion/import/map-lead-to-canonical";
import type { TekionLeadRecord } from "../../src/integrations/tekion/csv/lead-record";

const lead: TekionLeadRecord = {
  leadId: "lead-123",
  contactName: "Test Person",
  creationTime: "2026-09-17",
  source: "TrueCar",
  vehicleInterest: "2026 Honda CR-V",
  sourceTypeDetailed: "Internet",
  leadSourceGroup: "TrueCar",
  email: "test@example.com",
  mobilePhone: "555-0000",
  homePhone: "",
  workPhone: "",
  year: "2026",
  make: "Honda",
  model: "CR-V",
  status: "Active",
  stage: "Proposal",
  department: "Sales",
  dealership: "Test Dealer",
  dealStatus: "Quote",
  soldDate: "",
  closedTime: "",
};

describe("mapLeadToCanonical", () => {
  it("maps Tekion lead data to canonical opportunity data", () => {
    const result = mapLeadToCanonical(lead);

    expect(result).toEqual({
      source: "TrueCar",
      productInterest: "2026 Honda CR-V",
      vehicleYear: "2026",
      vehicleMake: "Honda",
      vehicleModel: "CR-V",
      status: "Active",
      stage: "Proposal",
    });
  });
});