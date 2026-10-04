import { describe, expect, it } from "vitest";

import type {
  LeadDetail,
  LeadTimelineRecord,
} from "./lead-detail-repository";

import {
  buildLeadDetailViewModel,
  getLeadTimelineEvents,
  getRawString,
} from "./lead-detail-view-model";

const lead: LeadDetail = {
  id: "lead-1",
  source_system: "tekion",
  source_type: "lead",
  external_record_id: "external-1",
  contact_name: "Test Customer",
  creation_time: "2026-09-01T12:00:00Z",
  source: "Internet",
  vehicle_interest: "",
  source_type_detailed: "",
  lead_source_group: "OEM",
  email: "test@example.com",
  mobile_phone: "555-555-5555",
  home_phone: "",
  work_phone: "",
  vehicle_year: "2026",
  vehicle_make: "Example",
  vehicle_model: "Vehicle",
  status: "Active",
  stage: "Engage",
  department: "Internet",
  dealership: "Example Motors",
  deal_status: "",
  sold_date: null,
  closed_time: null,
  raw_data: {
    salesperson: "Jane Smith",
  },
  created_at: "2026-09-01T12:00:00Z",
  updated_at: "2026-09-01T12:00:00Z",
};

const timeline: LeadTimelineRecord[] = [
  {
    id: "timeline-1",
    external_record_id: "external-1",
    source_file: "customer.txt",
    fixture_source_key: null,
    events: [
      {
        id: "event-1",
        timeline_record_id: "timeline-1",
        source_event_id: "source-1",
        source_file: "customer.txt",
        occurred_at: "2026-09-01T13:00:00Z",
        raw_type: "Email Sent",
        actor: "Salesperson",
        actor_type: "employee",
        category: "communication",
        channel: "email",
        direction: "outbound",
        details: "Hello",
        metadata: {},
        raw_data: {},
      },
      {
        id: "event-2",
        timeline_record_id: "timeline-1",
        source_event_id: "source-2",
        source_file: "customer.txt",
        occurred_at: "2026-09-02T13:00:00Z",
        raw_type: "Customer Reply",
        actor: "Customer",
        actor_type: "customer",
        category: "communication",
        channel: "email",
        direction: "inbound",
        details: "Thanks",
        metadata: {},
        raw_data: {},
      },
      {
        id: "event-3",
        timeline_record_id: "timeline-1",
        source_event_id: "source-3",
        source_file: "customer.txt",
        occurred_at: "2026-09-03T13:00:00Z",
        raw_type: "Task Completed",
        actor: "Salesperson",
        actor_type: "employee",
        category: "task",
        channel: null,
        direction: null,
        details: "Follow up",
        metadata: {},
        raw_data: {},
      },
      {
        id: "event-4",
        timeline_record_id: "timeline-1",
        source_event_id: "source-4",
        source_file: "customer.txt",
        occurred_at: "2026-09-04T13:00:00Z",
        raw_type: "Visit Set",
        actor: "Salesperson",
        actor_type: "employee",
        category: "visit",
        channel: "email",
        direction: "outbound",
        details: "Appointment scheduled for Friday",
        metadata: {},
        raw_data: {},
      },
    ],
  },
];

describe("lead detail view model", () => {
  it("keeps timeline events newest first", () => {
    const events = getLeadTimelineEvents(timeline);

    expect(events.map((event) => event.id)).toEqual([
      "event-4",
      "event-3",
      "event-2",
      "event-1",
    ]);
  });

  it("counts only explicitly classified communication events", () => {
    const model = buildLeadDetailViewModel(
      lead,
      timeline,
    );

    expect(model.communicationEvents).toHaveLength(2);
    expect(model.inboundEvents).toHaveLength(1);
    expect(model.outboundEvents).toHaveLength(1);
  });

  it("does not treat task activity as communication", () => {
    const model = buildLeadDetailViewModel(
      lead,
      timeline,
    );

    expect(
      model.communicationEvents.some(
        (event) => event.category === "task",
      ),
    ).toBe(false);
  });

  it("identifies appointment references without calling them appointment records", () => {
    const model = buildLeadDetailViewModel(
      lead,
      timeline,
    );

    expect(model.appointmentReferenceEvents).toHaveLength(1);
    expect(
      model.appointmentReferenceEvents[0]?.id,
    ).toBe("event-4");
  });

  it("preserves timeline source provenance", () => {
    const model = buildLeadDetailViewModel(
      lead,
      timeline,
    );

    expect(model.sourceFiles).toEqual([
      "customer.txt",
    ]);
    expect(model.timelineRecordCount).toBe(1);
  });

  it("reads only string raw-data values", () => {
    expect(
      getRawString(
        { salesperson: "Jane Smith" },
        "salesperson",
      ),
    ).toBe("Jane Smith");

    expect(
      getRawString(
        { salesperson: 123 },
        "salesperson",
      ),
    ).toBeNull();

    expect(
      getRawString(
        {},
        "salesperson",
      ),
    ).toBeNull();
  });
});
