import { describe, expect, it } from "vitest";
import { linkTimelineRecordToLead } from "./link-timeline-record-to-lead";

describe("linkTimelineRecordToLead", () => {
  it("links when authoritative external IDs match", () => {
    expect(
      linkTimelineRecordToLead({
        timelineRecordId: "timeline-1",
        timelineExternalRecordId: "lead-123",
        leadId: "db-lead-1",
        leadExternalRecordId: "lead-123",
      }),
    ).toEqual({
      status: "linked",
      timelineRecordId: "timeline-1",
      leadId: "db-lead-1",
    });
  });

  it("does not link a fixture timeline without an external ID", () => {
    expect(
      linkTimelineRecordToLead({
        timelineRecordId: "timeline-1",
        timelineExternalRecordId: null,
        leadId: "db-lead-1",
        leadExternalRecordId: "lead-123",
      }),
    ).toEqual({
      status: "unlinked",
      timelineRecordId: "timeline-1",
      reason: "missing_timeline_external_id",
    });
  });

  it("does not link when external IDs differ", () => {
    expect(
      linkTimelineRecordToLead({
        timelineRecordId: "timeline-1",
        timelineExternalRecordId: "lead-999",
        leadId: "db-lead-1",
        leadExternalRecordId: "lead-123",
      }),
    ).toEqual({
      status: "unlinked",
      timelineRecordId: "timeline-1",
      reason: "external_id_mismatch",
    });
  });
});
