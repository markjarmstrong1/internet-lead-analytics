import { describe, expect, it } from "vitest";
import { mapLeadToPerson } from "../../src/integrations/tekion/import/map-lead-to-person";
import type { TekionLeadRecord } from "../../src/integrations/tekion/csv/lead-record";

const lead: TekionLeadRecord = {
  leadId: "lead-123",
  contactName: "John Michael Smith",
  creationTime: "2026-09-17",
  source: "TrueCar",
  vehicleInterest: "2026 Honda CR-V",
  sourceTypeDetailed: "Internet",
  leadSourceGroup: "TrueCar",
  email: "test@example.com",
  mobilePhone: "555-0000",
  homePhone: "555-0001",
  workPhone: "555-0002",
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

describe("mapLeadToPerson", () => {
  it("maps the lead name and contact information", () => {
    const result = mapLeadToPerson(lead);

    expect(result).toEqual({
      firstName: "John",
      lastName: "Michael Smith",
      email: "test@example.com",
      phone: "555-0000",
    });
  });

  it("falls back to home phone when mobile is unavailable", () => {
    const result = mapLeadToPerson({
      ...lead,
      mobilePhone: "",
    });

    expect(result.phone).toBe("555-0001");
  });
});