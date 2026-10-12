import PDFDocument from "pdfkit";

import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildReport } from "@/reports/build-report";
import { metricDefinition } from "@/reports/report-catalog";
import { buildLeadObservations } from "@/analytics/observations/analytics-observations";
import { buildEmailEvidence } from "@/analytics/metrics/email-evidence";
import type { AnalyticsDataset } from "@/analytics/data/analytics-repository";
import type { ReportMetricKey, ReportResult } from "@/reports/report-types";
import { createServerReportRepository } from "@/reports/create-server-report-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLORS = {
  ink: "#172033",
  muted: "#64748b",
  line: "#dbe2ea",
  soft: "#f4f7fb",
  accent: "#244b75",
  white: "#ffffff",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { reportId } = await params;
    const repository = createServerReportRepository();
    const savedReport = await repository.findById(reportId);

    if (!savedReport) {
      return new Response("Report not found", { status: 404 });
    }

    const dataset = await createServerAnalyticsRepository().load();
    const result = buildReport(dataset, savedReport.definition);
    const pdf = await createPdf(result, dataset);

    const filename = safeFilename(savedReport.name);

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate report PDF", error);
    return new Response("Unable to generate report PDF", { status: 500 });
  }
}

async function createPdf(
  result: ReportResult,
  dataset: AnalyticsDataset,
): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    layout: "landscape",
    margins: { top: 38, bottom: 38, left: 38, right: 38 },
    bufferPages: true,
    info: {
      Title: result.definition.name,
      Author: "Internet Lead Analytics",
      Subject: "Management report",
    },
  });

  const chunks: Buffer[] = [];
  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer | Uint8Array) =>
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)),
    );
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const pageWidth = () =>
    doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottom = () => doc.page.height - doc.page.margins.bottom;
  const left = () => doc.page.margins.left;
  const metrics = result.definition.metrics;
  const tableWidth = pageWidth();

  // Analyze only leads included in this saved report.
  const selectedLeadIds = new Set(result.leadIds);
  const selectedObservations = buildLeadObservations(dataset)
    .filter((observation) => selectedLeadIds.has(observation.lead.leadId));

  const emailByLead = selectedObservations.map((observation) => ({
    observation,
    trackedEmails: buildEmailEvidence(observation.events)
      .filter((email) => email.trackingKnown),
  }));

  const trackedEmails = emailByLead.flatMap((item) => item.trackedEmails);
  const openedEmails = trackedEmails.filter((email) => email.opened);
  const noOpenEmails = trackedEmails.filter((email) => !email.opened);
  const clickedEmails = trackedEmails.filter((email) => email.clicks > 0);
  const sendsFollowedByInbound = trackedEmails.filter(
    (email) => email.firstInbound !== null,
  );
  const openedSendsFollowedByInbound = openedEmails.filter(
    (email) => email.firstInbound !== null,
  );
  const noOpenSendsFollowedByInbound = noOpenEmails.filter(
    (email) => email.firstInbound !== null,
  );

  // Lead-level cohorts are different from email-send counts.
  // Leads without usable email tracking are excluded from both cohorts.
  const openedLeadCohort = emailByLead.filter(
    (item) => item.trackedEmails.some((email) => email.opened),
  );
  const noOpenLeadCohort = emailByLead.filter(
    (item) =>
      item.trackedEmails.length > 0 &&
      item.trackedEmails.every((email) => !email.opened),
  );

  function leadOutcomeCounts(
    cohort: typeof openedLeadCohort,
  ) {
    return {
      leads: cohort.length,
      responses: cohort.filter(
        (item) => item.observation.evidence.response.state === "observed",
      ).length,
      appointments: cohort.filter(
        (item) => item.observation.appointmentEvidence,
      ).length,
      soldClosed: cohort.filter(
        (item) => item.observation.soldClosed,
      ).length,
    };
  }

  const openedLeadOutcomes = leadOutcomeCounts(openedLeadCohort);
  const noOpenLeadOutcomes = leadOutcomeCounts(noOpenLeadCohort);

  function heading(title: string, detail?: string) {
    doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.ink)
      .text(title, left(), doc.y, { width: tableWidth });
    doc.moveDown(0.2);
    if (detail) {
      doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted)
        .text(detail, left(), doc.y, { width: tableWidth });
      doc.moveDown(0.45);
    } else {
      doc.moveDown(0.6);
    }
  }

  function addTopRule() {
    doc.rect(0, 0, doc.page.width, 7).fill(COLORS.accent);
  }

  function drawCard(
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
    detail: string,
  ) {
    const height = 76;
    doc.roundedRect(x, y, width, height, 5)
      .fillAndStroke(COLORS.soft, COLORS.line);
    doc.rect(x, y, 3, height).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.muted)
      .text(label.toUpperCase(), x + 11, y + 10, {
        width: width - 20, height: 18, ellipsis: true,
      });
    doc.font("Helvetica-Bold").fontSize(value.length > 13 ? 15 : 21)
      .fillColor(COLORS.ink)
      .text(value, x + 11, y + 30, {
        width: width - 20, height: 25, ellipsis: true,
      });
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted)
      .text(detail, x + 11, y + 57, {
        width: width - 20, height: 11, ellipsis: true,
      });
  }

  function drawTableHeader(
    y: number,
    labelWidth: number,
    metricWidth: number,
  ) {
    const headerHeight = 48;
    doc.rect(left(), y, tableWidth, headerHeight).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.white)
      .text(result.definition.groupBy === "none" ? "REPORT" : "GROUP",
        left() + 6, y + 17, {
          width: labelWidth - 12, height: 25, ellipsis: true,
        });

    metrics.forEach((metric, index) => {
      doc.font("Helvetica-Bold")
        .fontSize(metrics.length > 10 ? 5.5 : metrics.length > 7 ? 6.2 : 7)
        .fillColor(COLORS.white)
        .text(pdfMetricLabel(metric),
          left() + labelWidth + index * metricWidth + 2, y + 5, {
            width: metricWidth - 4,
            height: headerHeight - 9,
            align: "center",
            ellipsis: true,
          });
    });
    return y + headerHeight;
  }

  // PAGE 1 — Executive summary
  addTopRule();
  doc.y = 29;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.accent)
    .text("INTERNET LEAD ANALYTICS");
  doc.moveDown(0.6);
  doc.font("Helvetica-Bold").fontSize(27).fillColor(COLORS.ink)
    .text(result.definition.name, left(), doc.y, { width: tableWidth });
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
    .text(
      `Reporting period: ${formatDateRange(result.definition.dateRange.start, result.definition.dateRange.end)}   |   Date basis: ${formatDateBasis(result.definition.dateRange.basis)}`,
      left(), doc.y, { width: tableWidth },
    );
  doc.moveDown(0.25);
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
    .text(
      `${result.populationCount.toLocaleString()} leads · ${result.rows.length.toLocaleString()} groups · Generated ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date())}`,
      left(), doc.y, { width: tableWidth },
    );
  doc.moveDown(1.1);
  heading("Executive summary", "Headline results for the selected report population");

  const summaryMetrics = metrics.slice(0, 3);
  const cards = [
    {
      label: "Report population",
      value: result.populationCount.toLocaleString(),
      detail: "Matching leads",
    },
    ...summaryMetrics.map((metric) => ({
      label: pdfMetricLabel(metric),
      value: formatMetric(metric, result.summary[metric] ?? null),
      detail: metricDefinition(metric)?.description ?? "Overall result",
    })),
  ];
  const gap = 12;
  const cardWidth = (tableWidth - gap * (cards.length - 1)) / cards.length;
  const cardY = doc.y;
  cards.forEach((card, index) =>
    drawCard(
      left() + index * (cardWidth + gap),
      cardY,
      cardWidth,
      card.label,
      card.value,
      card.detail,
    ),
  );
  doc.y = cardY + 98;

  heading("What this report covers");
  const summaryLines = [
    `Population: ${result.populationCount.toLocaleString()} leads matched the saved report definition and its filters.`,
    `Time basis: ${formatDateBasis(result.definition.dateRange.basis)}. The selected date basis determines which date is used to include a lead or activity in the reporting period.`,
    `Grouping: ${result.definition.groupBy === "none" ? "one overall result" : result.definition.groupBy}. Group rows organize the same selected population; they should not be interpreted as independent experiments.`,
    `Measures included: ${metrics.map(pdfMetricLabel).join(", ")}. Calculation evidence, email engagement, lead outcomes, and known limitations are provided in the supporting pages.`,
  ];
  summaryLines.forEach((line) => {
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.ink)
      .text(line, left() + 3, doc.y, { width: tableWidth - 6, lineGap: 2 });
    doc.moveDown(0.45);
  });

  doc.moveDown(0.5);
  const interpretationText =
    "CRM status, linked timeline activity, and observed communications are different evidence sources. A CRM-contacted flag does not itself prove that an outbound event was observed. Rates must be read with their stated denominator; unavailable evidence is not the same as a zero result. Differences between groups or templates are descriptive and do not prove causation.";
  const interpretationY = doc.y;
  const interpretationTextHeight = doc.font("Helvetica").fontSize(8)
    .heightOfString(interpretationText, {
      width: tableWidth - 22,
      lineGap: 2,
    });
  const interpretationHeight = interpretationTextHeight + 34;
  doc.roundedRect(left(), interpretationY, tableWidth, interpretationHeight, 4)
    .fillAndStroke(COLORS.soft, COLORS.line);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.ink)
    .text("How to read the results", left() + 11, interpretationY + 9);
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
    .text(interpretationText, left() + 11, interpretationY + 23, {
      width: tableWidth - 22,
      lineGap: 2,
    });
  doc.y = interpretationY + interpretationHeight + 8;

  // PAGE 2 — One unified results table and charts
  doc.addPage();
  addTopRule();
  doc.y = 27;
  heading("Results by group",
    `${metrics.length} selected measures · One unified table for all selected metrics`);

  if (result.rows.length === 0) {
    doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted)
      .text("No leads match this report definition.", left(), doc.y);
  } else {
    const labelWidth = metrics.length > 10 ? 100 : 118;
    const metricWidth = (tableWidth - labelWidth) / Math.max(metrics.length, 1);
    const rowHeight = 25;
    let y = drawTableHeader(doc.y, labelWidth, metricWidth);

    result.rows.forEach((row, rowIndex) => {
      if (y + rowHeight > bottom() - 175) {
        // Keep the table together on the results page when possible.
        // If a report has many groups, continue the same table on a new page.
        doc.addPage();
        addTopRule();
        doc.y = 27;
        heading("Results by group — continued");
        y = drawTableHeader(doc.y, labelWidth, metricWidth);
      }

      if (rowIndex % 2 === 1) {
        doc.rect(left(), y, tableWidth, rowHeight).fill(COLORS.soft);
      }
      doc.moveTo(left(), y + rowHeight).lineTo(left() + tableWidth, y + rowHeight)
        .lineWidth(0.35).strokeColor(COLORS.line).stroke();

      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.ink)
        .text(formatGroupLabel(result.definition.groupBy, row.label),
          left() + 6, y + 7, {
            width: labelWidth - 12, height: 12, ellipsis: true,
          });

      metrics.forEach((metric, index) => {
        const value = formatMetric(metric, row.values[metric] ?? null);
        doc.font("Helvetica").fontSize(metrics.length > 10 ? 6.2 : 7.5)
          .fillColor(value === "—" ? COLORS.muted : COLORS.ink)
          .text(value,
            left() + labelWidth + index * metricWidth + 2, y + 7, {
              width: metricWidth - 4, height: 12, align: "right", ellipsis: true,
            });
      });
      y += rowHeight;
    });


  }

  // EVIDENCE PAGE — show the calculation and evidence behind each result.
  doc.addPage();
  addTopRule();
  doc.y = 30;
  heading(
    "Evidence & metric calculations",
    "Numerators, denominators, eligible populations, and evidence limitations",
  );

  const evidenceLabels: Record<string, string> = {
    none: "No specific evidence requirement",
    crm_state: "CRM state",
    observed_outbound: "Qualifying outbound timeline activity",
    observed_response: "Observed inbound response evidence",
    observed_appointment: "Observed appointment evidence",
    crm_outcome: "CRM outcome state",
  };
  const populationLabels: Record<string, string> = {
    report_population: "Selected report population",
    observed_outbound_population: "Leads with observed outbound",
    responding_population: "Leads with observed response",
  };

  metrics.forEach((metric) => {
    const definition = metricDefinition(metric);
    const diagnostic = result.summaryDiagnostics[metric];
    const description =
      definition?.description ?? "No metric definition is available.";
    const numeratorMetric =
      definition?.numerator ??
      (metric === "responseRate"
        ? "responded"
        : metric === "responseWithin24hRate"
          ? "responseWithin24h"
          : metric === "emailOpenRate"
            ? "emailsOpened"
            : metric === "emailTrackingCoverage"
              ? "trackedEmailSends"
              : null);

    const calculation =
      diagnostic?.denominatorMetric
        ? `${numeratorMetric ? pdfMetricLabel(numeratorMetric) : "Numerator"}: ${
            diagnostic.numerator === null
              ? "unavailable"
              : formatMetric(numeratorMetric ?? metric, diagnostic.numerator)
          }  /  ${pdfMetricLabel(diagnostic.denominatorMetric)}: ${
            diagnostic.denominator === null
              ? "unavailable"
              : formatMetric(
                  diagnostic.denominatorMetric,
                  diagnostic.denominator,
                )
          }`
        : null;

    const population = diagnostic
      ? populationLabels[diagnostic.population] ?? diagnostic.population
      : definition?.population?.replace(/_/g, " ") ?? "Not specified";
    const evidence = definition?.evidence
      ? evidenceLabels[definition.evidence] ?? definition.evidence
      : "Not specified";
    const cohort = diagnostic
      ? `Eligible leads: ${diagnostic.eligibleLeadCount.toLocaleString()}  ·  With linked timeline records: ${diagnostic.timelineCoveredLeadCount.toLocaleString()}`
      : null;

    const estimate =
      54 +
      Math.ceil(
        (description.length +
          (calculation?.length ?? 0) +
          (cohort?.length ?? 0)) / 115,
      ) * 12;

    if (doc.y + estimate > bottom() - 8) {
      doc.addPage();
      addTopRule();
      doc.y = 30;
      heading(
        "Evidence & metric calculations — continued",
        "Calculation notes for the remaining selected measures",
      );
    }

    const startY = doc.y;
    doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink)
      .text(pdfMetricLabel(metric), left(), startY, {
        width: tableWidth,
      });
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
      .text(description, left(), doc.y, {
        width: tableWidth,
        lineGap: 2,
      });
    doc.moveDown(0.2);
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.ink)
      .text(`Population: ${population}  ·  Evidence: ${evidence}`, left(), doc.y, {
        width: tableWidth,
        lineGap: 1,
      });
    doc.moveDown(0.15);

    if (calculation) {
      doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.ink)
        .text(`Calculation: ${calculation}`, left(), doc.y, {
          width: tableWidth,
          lineGap: 1,
        });
      doc.moveDown(0.15);
    }

    if (cohort) {
      doc.font("Helvetica").fontSize(7.2).fillColor(COLORS.muted)
        .text(cohort, left(), doc.y, {
          width: tableWidth,
        });
      doc.moveDown(0.15);
    }

    doc.moveDown(0.15);
    doc.moveTo(left(), doc.y).lineTo(left() + tableWidth, doc.y)
      .lineWidth(0.35).strokeColor(COLORS.line).stroke();
    doc.moveDown(0.4);
  });

  const evidenceCaveats = [
    "Email open rate counts unique tracked email sends with at least one recorded open, divided by tracked sends. Repeated opens on one send do not count as multiple opened emails.",
    "Email tracking coverage is tracked sends divided by qualifying email sends. A send with no usable tracking details is unknown, not a confirmed zero-open send.",
    "Counts based on linked timeline events describe evidence available to this system; they do not prove every real-world event was captured.",
    "Rates are only meaningful with their stated denominator. A missing or zero denominator is unavailable, not a zero-percent result.",
    "Group and template comparisons are descriptive associations. They do not establish that a source, message, or template caused an outcome.",
  ];

  doc.moveDown(0.25);
  if (doc.y + 75 > bottom()) {
    doc.addPage();
    addTopRule();
    doc.y = 30;
  }
  heading("Evidence limitations", "Read these notes before drawing conclusions");
  evidenceCaveats.forEach((note) => {
    const estimate = 18 + Math.ceil(note.length / 120) * 10;
    if (doc.y + estimate > bottom()) {
      doc.addPage();
      addTopRule();
      doc.y = 30;
      heading("Evidence limitations — continued");
    }
    doc.font("Helvetica").fontSize(7.7).fillColor(COLORS.muted)
      .text(`•  ${note}`, left() + 2, doc.y, {
        width: tableWidth - 4,
        lineGap: 2,
      });
    doc.moveDown(0.35);
  });

  // EMAIL ENGAGEMENT — connect tracked sends to observed lead outcomes.
  doc.addPage();
  addTopRule();
  doc.y = 30;
  heading(
    "Email engagement & lead outcomes",
    "Tracked email activity and subsequent observable outcomes within this report population",
  );

  const emailSummary = [
    `Qualifying email sends observed: ${buildEmailEvidence(
      selectedObservations.flatMap((observation) => observation.events),
    ).length.toLocaleString()}.`,
    `Tracked sends: ${trackedEmails.length.toLocaleString()} · Sends with at least one recorded open: ${openedEmails.length.toLocaleString()} · Tracked sends with no recorded open: ${noOpenEmails.length.toLocaleString()}.`,
    `Recorded opens across tracked sends: ${trackedEmails.reduce((total, email) => total + email.opens, 0).toLocaleString()} · Tracked sends with a recorded click: ${clickedEmails.length.toLocaleString()}.`,
    `Tracked sends followed by an observed inbound communication before another outbound communication: ${sendsFollowedByInbound.length.toLocaleString()} of ${trackedEmails.length.toLocaleString()}.`,
    `Among those sends: ${openedSendsFollowedByInbound.length.toLocaleString()} opened sends and ${noOpenSendsFollowedByInbound.length.toLocaleString()} sends with no recorded open were followed by an observed inbound communication.`,
  ];

  emailSummary.forEach((line) => {
    doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.ink)
      .text(line, left() + 2, doc.y, {
        width: tableWidth - 4,
        lineGap: 2,
      });
    doc.moveDown(0.45);
  });

  doc.moveDown(0.35);
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink)
    .text("Lead outcomes by email-open cohort", left(), doc.y);
  doc.moveDown(0.3);
  doc.font("Helvetica").fontSize(7.8).fillColor(COLORS.muted)
    .text(
      "Each lead is counted once per cohort. Only leads with at least one tracked email are included; leads with no usable email tracking are excluded.",
      left(), doc.y, { width: tableWidth, lineGap: 2 },
    );
  doc.moveDown(0.6);

  const cohortColumns = [
    { label: "LEAD COHORT", width: tableWidth * 0.42 },
    { label: "LEADS", width: tableWidth * 0.13 },
    { label: "OBSERVED RESPONSES", width: tableWidth * 0.17 },
    { label: "APPOINTMENTS", width: tableWidth * 0.14 },
    { label: "SOLD / CLOSED", width: tableWidth * 0.14 },
  ];
  const cohortHeaderY = doc.y;
  doc.rect(left(), cohortHeaderY, tableWidth, 29).fill(COLORS.accent);
  let columnX = left();
  cohortColumns.forEach((column) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.white)
      .text(column.label, columnX + 4, cohortHeaderY + 8, {
        width: column.width - 8,
        height: 16,
        align: column.label === "LEAD COHORT" ? "left" : "right",
        ellipsis: true,
      });
    columnX += column.width;
  });

  const cohortRows = [
    { label: "At least one email opened", ...openedLeadOutcomes },
    { label: "Tracked emails, none recorded open", ...noOpenLeadOutcomes },
  ];
  let cohortY = cohortHeaderY + 29;
  cohortRows.forEach((row, rowIndex) => {
    if (rowIndex % 2 === 1) {
      doc.rect(left(), cohortY, tableWidth, 27).fill(COLORS.soft);
    }
    const values = [
      row.label,
      row.leads.toLocaleString(),
      row.responses.toLocaleString(),
      row.appointments.toLocaleString(),
      row.soldClosed.toLocaleString(),
    ];
    let x = left();
    values.forEach((value, index) => {
      const column = cohortColumns[index];
      doc.font(index === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.8).fillColor(COLORS.ink)
        .text(value, x + 4, cohortY + 8, {
          width: column.width - 8,
          height: 12,
          align: index === 0 ? "left" : "right",
          ellipsis: true,
        });
      x += column.width;
    });
    doc.moveTo(left(), cohortY + 27).lineTo(left() + tableWidth, cohortY + 27)
      .lineWidth(0.35).strokeColor(COLORS.line).stroke();
    cohortY += 27;
  });
  doc.y = cohortY + 16;

  const emailInterpretation = [
    "Open rate is based on unique tracked sends with at least one recorded open, divided by tracked sends. It is not the percentage of leads who opened an email.",
    "The lead cohort comparison counts each lead once. A lead may receive multiple emails; the send-level counts above are not unique-lead counts.",
    "A response after a send means an inbound communication was observed after that send and before another outbound communication. It does not establish that the response happened after an open.",
    "Recorded opens and clicks are tracking signals, not proof a person read the message. Email opens may be affected by privacy features or automated systems.",
    "These comparisons are descriptive, not causal. Differences between cohorts do not prove that opening an email caused a response, appointment, or sale.",
  ];

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink)
    .text("How to interpret this evidence", left(), doc.y);
  doc.moveDown(0.35);
  emailInterpretation.forEach((note) => {
    const estimatedHeight = doc.font("Helvetica").fontSize(7.8)
      .heightOfString(note, { width: tableWidth - 12, lineGap: 2 }) + 7;
    if (doc.y + estimatedHeight > bottom() - 8) {
      doc.addPage();
      addTopRule();
      doc.y = 30;
      heading("Email engagement & lead outcomes — continued");
    }
    doc.font("Helvetica").fontSize(7.8).fillColor(COLORS.muted)
      .text(`•  ${note}`, left() + 2, doc.y, {
        width: tableWidth - 4,
        lineGap: 2,
      });
    doc.moveDown(0.35);
  });

  const notes = [
    "Population and date basis: leads are included according to the saved report definition and selected date basis.",
    "CRM contacted: based on the CRM First Contacted Time value; it is not proof that qualifying outbound activity was observed.",
    "Observed outbound and responses: based on qualifying communication evidence available in linked timeline data.",
    "Response rate: observed responses divided by leads with observed outbound evidence. A missing denominator is shown as a dash rather than treated as zero.",
    "Timeline coverage: indicates linked timeline records, not proof that every communication or event was captured.",
    "Template comparisons: matched-template uses count qualifying outbound actions, so uses can exceed the number of leads. Group comparisons are descriptive and do not establish causation.",
  ];
  if (doc.y + 90 > bottom()) {
    doc.addPage();
    addTopRule();
    doc.y = 30;
  }
  heading("Interpretation and limitations");
  notes.forEach((note) => {
    if (doc.y + 30 > bottom()) {
      doc.addPage();
      addTopRule();
      doc.y = 30;
      heading("Interpretation and limitations — continued");
    }
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
      .text(`•  ${note}`, left() + 2, doc.y, {
        width: tableWidth - 4, lineGap: 2,
      });
    doc.moveDown(0.45);
  });

  // Add footers only after the content is laid out. No footer-only pages.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageLabel = `Page ${i - range.start + 1} of ${range.count}`;
    const y = doc.page.height - 25;
    doc.save();
    doc.moveTo(doc.page.margins.left, y - 6)
      .lineTo(doc.page.width - doc.page.margins.right, y - 6)
      .lineWidth(0.45).strokeColor(COLORS.line).stroke();
    doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted)
      .text("INTERNET LEAD ANALYTICS  /  MANAGEMENT REPORT",
        doc.page.margins.left, y, {
          width: pageWidth() * 0.7, lineBreak: false,
        });
    doc.text(pageLabel, doc.page.margins.left, y, {
      width: pageWidth(), align: "right", lineBreak: false,
    });
    doc.restore();
  }

  doc.end();
  return finished;
}

function chunkMetrics(metrics: ReportMetricKey[], size: number): ReportMetricKey[][] {
  const groups: ReportMetricKey[][] = [];
  for (let index = 0; index < metrics.length; index += size) {
    groups.push(metrics.slice(index, index + size));
  }
  return groups;
}

function pdfMetricLabel(metric: ReportMetricKey): string {
  const labels: Partial<Record<ReportMetricKey, string>> = {
    leads: "Leads",
    timelineCovered: "Timeline covered",
    contacted: "CRM contacted",
    observedOutbound: "Observed outbound",
    responded: "Observed responses",
    responseWithin24h: "Responses within 24h",
    appointments: "Appointments",
    soldClosed: "Sold / closed",
    responseRate: "Observed response rate",
    responseWithin24hRate: "24-hour response rate",
    medianResponseMinutes: "Median response time",
    outboundAttempts: "Outbound attempts",
    templateUses: "Matched template uses",
    templateUsesPerLead: "Template uses per lead",
  };
  return labels[metric] ?? metricDefinition(metric)?.label ?? metric;
}

function formatGroupLabel(dimension: string, label: string): string {
  if (dimension === "template" && label !== "No matched template") {
    return label.startsWith("Template ") ? label : `Template ${label}`;
  }
  return label;
}

function formatMetric(metric: ReportMetricKey, value: number | null): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const format = metricDefinition(metric)?.format;

  if (format === "percent") {
    return `${(value * 100).toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
  }
  if (format === "minutes") {
    if (value < 60) return `${Math.round(value)} min`;
    const hours = Math.floor(value / 60);
    const minutes = Math.round(value % 60);
    return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
  }
  if (format === "decimal") {
    return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
  return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "All available dates";
  if (start && end) return `${start} through ${end}`;
  if (start) return `From ${start}`;
  return `Through ${end}`;
}

function formatDateBasis(value: string): string {
  return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function safeFilename(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "management-report";
}
