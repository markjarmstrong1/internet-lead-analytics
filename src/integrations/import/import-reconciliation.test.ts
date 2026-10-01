import { describe, expect, it } from "vitest";
import {
  reconcileImportRecords,
} from "./import-reconciliation";

type Record = {
  id: string;
  value: string;
};

describe("reconcileImportRecords", () => {
  it("classifies new records", () => {
    const result = reconcileImportRecords(
      [{ id: "new", value: "A" }],
      [],
      {
        getIdentity: (record) => record.id,
        isEqual: (incoming, existing) => incoming.value === existing.value,
      },
    );

    expect(result.summary).toEqual({
      total: 1,
      newCount: 1,
      updatedCount: 0,
      unchangedCount: 0,
      invalidCount: 0,
    });
  });

  it("classifies unchanged records", () => {
    const existing: Record = {
      id: "1",
      value: "A",
    };

    const result = reconcileImportRecords(
      [existing],
      [existing],
      {
        getIdentity: (record) => record.id,
        isEqual: (incoming, current) => incoming.value === current.value,
      },
    );

    expect(result.summary.unchangedCount).toBe(1);
  });

  it("classifies changed records as updates", () => {
    const result = reconcileImportRecords(
      [{ id: "1", value: "B" }],
      [{ id: "1", value: "A" }],
      {
        getIdentity: (record) => record.id,
        isEqual: (incoming, existing) => incoming.value === existing.value,
      },
    );

    expect(result.summary.updatedCount).toBe(1);
  });

  it("rejects records without stable identity", () => {
    const result = reconcileImportRecords(
      [{ id: "", value: "A" }],
      [],
      {
        getIdentity: (record) => record.id || null,
        isEqual: (incoming, existing) => incoming.value === existing.value,
      },
    );

    expect(result.summary.invalidCount).toBe(1);
  });

  it("is idempotent for unchanged incoming records", () => {
    const existing: Record = {
      id: "1",
      value: "A",
    };

    const first = reconcileImportRecords(
      [existing],
      [existing],
      {
        getIdentity: (record) => record.id,
        isEqual: (incoming, current) => incoming.value === current.value,
      },
    );

    const second = reconcileImportRecords(
      [existing],
      [existing],
      {
        getIdentity: (record) => record.id,
        isEqual: (incoming, current) => incoming.value === current.value,
      },
    );

    expect(first.summary).toEqual(second.summary);
    expect(second.summary.newCount).toBe(0);
    expect(second.summary.updatedCount).toBe(0);
    expect(second.summary.unchangedCount).toBe(1);
  });
});
