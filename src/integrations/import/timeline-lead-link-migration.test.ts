import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/20261008000002_restore_timeline_lead_link_resolution.sql",
  "utf8",
);

describe("timeline lead-link resolution migration", () => {
  it("resolves the transient external lead identity to the canonical lead ID", () => {
    expect(migration).toMatch(/resolved_lead_id uuid;/);
    expect(migration).toMatch(
      /l\.external_record_id\s*=\s*trim\(incoming ->> 'resolved_lead_external_record_id'\)/,
    );
    expect(migration).toMatch(/l\.source_type\s*=\s*'lead'/);
  });

  it("links new timeline records using the resolved lead ID", () => {
    expect(migration).toMatch(
      /coalesce\(nullif\(incoming ->> 'lead_id', ''\)::uuid,\s*resolved_lead_id\)/,
    );
  });

  it("preserves existing links while repairing missing links on updated records", () => {
    expect(migration).toMatch(
      /public\.timeline_records\.lead_id,\s*resolved_lead_id/,
    );
  });

  it("repairs missing links on unchanged records without replacing existing links", () => {
    expect(migration).toMatch(
      /set lead_id = coalesce\(lead_id, resolved_lead_id\)/,
    );
  });

  it("preserves idempotent event upserts", () => {
    expect(migration).toMatch(
      /on\s+conflict\s*\(\s*timeline_record_id\s*,\s*source_event_id\s*\)\s*do\s+update\s+set/i,
    );
    expect(migration).toContain("raw_data = excluded.raw_data;");
  });
});
