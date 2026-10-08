import { describe, expect, it } from "vitest";

import { MANAGEMENT_REPORT_PRESETS } from "./report-presets";

describe("management report presets", () => {
  it("compares response performance across sources without excluding non-responders", () => {
    const preset = MANAGEMENT_REPORT_PRESETS.find(
      (item) => item.key === "response-patterns",
    );

    expect(preset).toBeDefined();
    expect(preset).toMatchObject({
      groupBy: "source",
      evidence: {
        outbound: "observed",
      },
    });
    expect(preset?.evidence.response).toBeUndefined();
    expect(preset?.metrics).toContain("responseRate");
    expect(preset?.metrics).toContain("responseWithin24hRate");
    expect(preset?.metrics).toContain("medianResponseMinutes");
  });

  it("defines all five intended management questions", () => {
    expect(MANAGEMENT_REPORT_PRESETS.map((item) => item.key)).toEqual([
      "losing-internet-leads",
      "response-patterns",
      "non-responder-commonalities",
      "positive-outcome-patterns",
      "template-usage",
    ]);
  });

  it("measures matched-template usage without assigning each lead to only one template", () => {
    const preset = MANAGEMENT_REPORT_PRESETS.find(
      (item) => item.key === "template-usage",
    );

    expect(preset).toBeDefined();
    expect(preset).toMatchObject({
      groupBy: "none",
      evidence: {
        outbound: "observed",
      },
    });
    expect(preset?.metrics).toContain("outboundAttempts");
    expect(preset?.metrics).toContain("templateUses");
    expect(preset?.metrics).toContain("templateUsesPerLead");
    expect(preset?.groupBy).not.toBe("template");
  });
});
