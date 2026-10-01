import { describe, expect, it, vi } from "vitest";

const { getFirstOutboundResponseRate } = vi.hoisted(() => ({
  getFirstOutboundResponseRate: vi.fn(),
}));

vi.mock(
  "@/analytics/metrics/get-first-outbound-response-rate",
  () => ({
    getFirstOutboundResponseRate,
  }),
);

import { GET } from "./route";

describe("GET /api/analytics/first-outbound-response-rate", () => {
  it("returns the calculated reportable metric", async () => {
    const metric = {
      id: "first_outbound_response_rate_24h",
      title:
        "Inbound communication response rate after first outbound employee communication",
      classification: "descriptive",
      denominator: 2,
      numerator: 1,
      rate: 0.5,
      windowHours: 24,
      breakdowns: [],
      evidence: [],
      limitations: [],
    };

    getFirstOutboundResponseRate.mockResolvedValue(metric);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      metric,
    });
    expect(getFirstOutboundResponseRate).toHaveBeenCalledTimes(1);
  });

  it("returns a server error when metric calculation fails", async () => {
    getFirstOutboundResponseRate.mockRejectedValue(
      new Error("timeline read failed"),
    );

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      ok: false,
      error: "timeline read failed",
    });
  });
});
