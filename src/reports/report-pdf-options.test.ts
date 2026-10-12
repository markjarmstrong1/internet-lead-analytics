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
      layoutPreset: "detailed",
      orientation: "landscape",
      density: "comfortable",
      maxRows: "all",
      subtitle: "",
      sectionTitles: {
        executiveSummary: "Executive summary",
        detailedResults: "Results by group",
        metricDefinitions: "Evidence & metric calculations",
        templateUsage: "Matched-template usage",
        emailEngagement: "Email engagement & lead outcomes",
      },
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
      layoutPreset: "detailed",
      orientation: "landscape",
      density: "comfortable",
      maxRows: "all",
      subtitle: "",
      sectionTitles: {
        executiveSummary: "Executive summary",
        detailedResults: "Results by group",
        metricDefinitions: "Evidence & metric calculations",
        templateUsage: "Matched-template usage",
        emailEngagement: "Email engagement & lead outcomes",
      },
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
