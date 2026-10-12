import { describe, expect, it } from "vitest";

import { normalizeReportDefinition } from "./report-definition";

describe("report PDF output options", () => {
  it("enables all PDF sections for older or incomplete definitions", () => {
    const definition = normalizeReportDefinition({});

    expect(definition.pdfOptions).toEqual({
      includeExecutiveSummary: true,
      includeDetailedResults: true,
      includeMetricDefinitions: true,
      includeTemplateUsage: true,
      includeEmailEngagement: true,
    });
  });

  it("preserves a user's selected PDF sections", () => {
    const definition = normalizeReportDefinition({
      pdfOptions: JSON.stringify({
        includeExecutiveSummary: true,
        includeDetailedResults: false,
        includeMetricDefinitions: false,
        includeTemplateUsage: true,
        includeEmailEngagement: false,
      }),
    });

    expect(definition.pdfOptions).toEqual({
      includeExecutiveSummary: true,
      includeDetailedResults: false,
      includeMetricDefinitions: false,
      includeTemplateUsage: true,
      includeEmailEngagement: false,
    });
  });

  it("defaults invalid or missing option values safely", () => {
    const definition = normalizeReportDefinition({
      pdfOptions: { includeDetailedResults: "no" },
    });

    expect(definition.pdfOptions.includeDetailedResults).toBe(true);
    expect(definition.pdfOptions.includeExecutiveSummary).toBe(true);
  });
});
