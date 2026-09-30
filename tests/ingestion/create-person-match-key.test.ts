import { describe, expect, it } from "vitest";
import { createPersonMatchKey } from "../../src/integrations/tekion/import/create-person-match-key";
import type { TekionLeadRecord } from "../../src/integrations/tekion/csv/lead-record";

const lead: TekionLeadRecord = {
  leadId: "lead-123",
  contactName: "Test Person",
  creationTime: "2026-09-17",
  source: "TrueCar",
  vehicleInterest: "2026 Honda CR-V",
  sourceTypeDetailed: "Internet",
  leadSourceGroup: "TrueCar",
  email: " TEST@example.com ",
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

describe("createPersonMatchKey", () => {
  it("normalizes email and preserves phone", () => {
    const result = createPersonMatchKey(lead);

    expect(result).toEqual({
      email: "test@example.com",
      phone: "555-0000",
    });
  });
});