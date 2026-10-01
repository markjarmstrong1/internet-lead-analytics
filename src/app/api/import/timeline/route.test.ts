import { describe, expect, it, vi } from "vitest";

const { runTimelineImport } = vi.hoisted(() => ({
  runTimelineImport: vi.fn(),
}));

vi.mock(
  "@/integrations/import/run-timeline-import",
  () => ({
    runTimelineImport,
  }),
);

import { POST } from "./route";

describe("POST /api/import/timeline", () => {
  it("rejects a request without timeline files", async () => {
    const response = await POST(
      new Request("http://localhost/api/import/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "A valid timeline import batch is required.",
    });

    expect(runTimelineImport).not.toHaveBeenCalled();
  });

  it("runs the timeline import and returns its result", async () => {
    const result = {
      records: {
        total: 1,
        newCount: 1,
        updatedCount: 0,
        unchangedCount: 0,
        invalidCount: 0,
      },
      events: {
        total: 2,
        newCount: 2,
        updatedCount: 0,
        unchangedCount: 0,
        invalidCount: 0,
      },
    };

    runTimelineImport.mockResolvedValue(result);

    const batch = {
      timelineFiles: [
        {
          sourceKey: "lead.txt",
          fileName: "lead.txt",
          relativePath: "lead.txt",
          events: [],
        },
      ],
      csvFiles: [],
    };

    const response = await POST(
      new Request("http://localhost/api/import/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      result,
    });

    expect(runTimelineImport).toHaveBeenCalledWith(batch);
  });

  it("returns a server error when execution fails", async () => {
    runTimelineImport.mockRejectedValue(
      new Error("database unavailable"),
    );

    const batch = {
      timelineFiles: [
        {
          sourceKey: "lead.txt",
          fileName: "lead.txt",
          relativePath: "lead.txt",
          events: [],
        },
      ],
      csvFiles: [],
    };

    const response = await POST(
      new Request("http://localhost/api/import/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batch),
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "database unavailable",
    });
  });
});
