import PDFDocument from "pdfkit";

import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildReport } from "@/reports/build-report";
import { metricDefinition } from "@/reports/report-catalog";
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
    const pdf = await createPdf(result);

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

async function createPdf(result: ReportResult): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "LETTER",
    layout: "landscape",
    margins: { top: 42, bottom: 42, left: 42, right: 42 },
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

  const pageWidth = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const bottom = () => doc.page.height - doc.page.margins.bottom;

  function sectionTitle(title: string, detail?: string) {
    doc.moveDown(0.8);
    doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.ink).text(title);
    if (detail) {
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted).text(detail);
    }
    doc.moveDown(0.55);
  }

  function ensureSpace(height: number) {
    if (doc.y + height > bottom() - 10) {
      doc.addPage();
    }
  }

  function drawMetricTableHeader(
    metrics: ReportMetricKey[],
    labelWidth: number,
    metricWidth: number,
    tableX: number,
  ) {
    const headerY = doc.y;
    const headerHeight = 36;
    doc.rect(tableX, headerY, pageWidth(), headerHeight).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.white)
      .text(result.definition.groupBy === "none" ? "REPORT" : "GROUP", tableX + 8, headerY + 11, {
        width: labelWidth - 14,
        height: 25,
        ellipsis: true,
      });

    metrics.forEach((metric, index) => {
      const label = pdfMetricLabel(metric);
      doc.font("Helvetica-Bold")
        .fontSize(metrics.length > 9 ? 6.2 : 7)
        .fillColor(COLORS.white)
        .text(label, tableX + labelWidth + index * metricWidth + 3, headerY + 5, {
          width: metricWidth - 6,
          height: headerHeight - 8,
          align: "center",
          lineBreak: true,
          ellipsis: true,
        });
    });

    doc.y = headerY + headerHeight;
  }

  const metrics = result.definition.metrics;
  const tableX = doc.page.margins.left;
  const tableWidth = pageWidth();
  const labelWidth = Math.min(170, Math.max(120, tableWidth * 0.25));
  const metricGroups = chunkMetrics(metrics, 6);

  // Report masthead
  doc.rect(0, 0, doc.page.width, 9).fill(COLORS.accent);
  doc.y = 38;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.accent)
    .text("INTERNET LEAD ANALYTICS");
  doc.moveDown(0.8);

  doc.font("Helvetica-Bold").fontSize(25).fillColor(COLORS.ink)
    .text(result.definition.name, { width: pageWidth() });
  doc.moveDown(0.45);

  doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.muted)
    .text(
      `Reporting period: ${formatDateRange(result.definition.dateRange.start, result.definition.dateRange.end)}   |   Date basis: ${formatDateBasis(result.definition.dateRange.basis)}`,
      { width: pageWidth() },
    );
  doc.moveDown(0.35);
  doc.font("Helvetica").fontSize(8.5).fillColor(COLORS.muted)
    .text(
      `${result.populationCount.toLocaleString()} leads in population  ·  ${result.rows.length.toLocaleString()} report groups  ·  Generated ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date())}`,
      { width: pageWidth() },
    );

  doc.moveDown(1);
  doc.moveTo(tableX, doc.y).lineTo(tableX + tableWidth, doc.y)
    .lineWidth(1.2).strokeColor(COLORS.line).stroke();
  doc.moveDown(0.5);

  // Executive summary cards
  sectionTitle("Executive summary", "Overall results for the selected report population");
  const cards: Array<{ label: string; value: string; detail: string }> = [
    {
      label: "REPORT POPULATION",
      value: result.populationCount.toLocaleString(),
      detail: "Matching leads",
    },
    ...metrics.slice(0, 3).map((metric) => ({
      label: metricDefinition(metric)?.label ?? metric,
      value: formatMetric(metric, result.summary[metric] ?? null),
      detail: "Overall result",
    })),
  ];

  const cardGap = 10;
  const cardWidth = (tableWidth - cardGap * (cards.length - 1)) / cards.length;
  const cardY = doc.y;
  const cardHeight = 69;

  cards.forEach((card, index) => {
    const x = tableX + index * (cardWidth + cardGap);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 5)
      .fillAndStroke(COLORS.soft, COLORS.line);
    doc.rect(x, cardY, 3, cardHeight).fill(COLORS.accent);
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.muted)
      .text(card.label.toUpperCase(), x + 12, cardY + 10, {
        width: cardWidth - 22,
        height: 20,
        ellipsis: true,
      });
    doc.font("Helvetica-Bold").fontSize(card.value.length > 15 ? 15 : 20)
      .fillColor(COLORS.ink)
      .text(card.value, x + 12, cardY + 29, {
        width: cardWidth - 22,
        height: 24,
        ellipsis: true,
      });
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted)
      .text(card.detail, x + 12, cardY + 52, {
        width: cardWidth - 22,
        height: 11,
        ellipsis: true,
      });
  });

  doc.y = cardY + cardHeight + 22;

  ensureSpace(135);
  sectionTitle(
    "Results by group",
    `${metrics.length} selected measure${metrics.length === 1 ? "" : "s"} · Numeric values are aligned for comparison`,
  );

  if (result.rows.length === 0) {
    doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
      .text("No leads match this report definition.", tableX + 8, doc.y + 12);
    doc.y += 36;
  } else {
    metricGroups.forEach((metricGroup, groupIndex) => {
      if (groupIndex > 0) {
        ensureSpace(135);
        doc.moveDown(0.45);
        sectionTitle(
          `Additional measures (${groupIndex + 1} of ${metricGroups.length})`,
          "The same report groups, with additional selected measures.",
        );
      }

      const groupLabelWidth = Math.min(155, Math.max(130, tableWidth * 0.22));
      const metricWidth =
        (tableWidth - groupLabelWidth) / Math.max(metricGroup.length, 1);
      const rowHeight = 27;

      const drawHeader = () =>
        drawMetricTableHeader(
          metricGroup,
          groupLabelWidth,
          metricWidth,
          tableX,
        );

      // Keep the table header with at least the first data row.
      ensureSpace(36 + rowHeight + 12);
      drawHeader();

      result.rows.forEach((row, rowIndex) => {
        if (doc.y + rowHeight > bottom() - 12) {
          doc.addPage();
          drawHeader();
        }

        const y = doc.y;
        if (rowIndex % 2 === 1) {
          doc.rect(tableX, y, tableWidth, rowHeight).fill(COLORS.soft);
        }
        doc.moveTo(tableX, y + rowHeight)
          .lineTo(tableX + tableWidth, y + rowHeight)
          .lineWidth(0.35)
          .strokeColor(COLORS.line)
          .stroke();

        doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.ink)
          .text(formatGroupLabel(result.definition.groupBy, row.label),
            tableX + 8, y + 8, {
              width: groupLabelWidth - 16,
              height: 12,
              ellipsis: true,
            });

        metricGroup.forEach((metric, index) => {
          const value = formatMetric(metric, row.values[metric] ?? null);
          doc.font("Helvetica").fontSize(8)
            .fillColor(value === "—" ? COLORS.muted : COLORS.ink)
            .text(value, tableX + groupLabelWidth + index * metricWidth + 3, y + 8, {
              width: metricWidth - 6,
              height: 12,
              align: "right",
              ellipsis: true,
            });
        });

        doc.y = y + rowHeight;
      });
    });
  }

  // Concise definitions section so the PDF retains essential context.
  ensureSpace(115);
  sectionTitle("Measurement notes");
  doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
    .text(
      "Results reflect the evidence available in the analytics dataset and the report's selected filters. CRM state and observed communication activity are distinct measures. Group comparisons are descriptive and do not establish causation. Timeline coverage indicates linked timeline records, not proof that every event was captured.",
      { width: pageWidth(), lineGap: 3 },
    );

  // Add consistent footers after all pages have been composed.
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageLabel = `Page ${i - range.start + 1} of ${range.count}`;
    const y = doc.page.height - 27;
    doc.save();
    doc.moveTo(doc.page.margins.left, y - 7)
      .lineTo(doc.page.width - doc.page.margins.right, y - 7)
      .lineWidth(0.5).strokeColor(COLORS.line).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted)
      .text("INTERNET LEAD ANALYTICS  /  MANAGEMENT REPORT", doc.page.margins.left, y, {
        width: pageWidth() * 0.7,
        lineBreak: false,
      });
    doc.text(pageLabel, doc.page.margins.left, y, {
      width: pageWidth(),
      align: "right",
      lineBreak: false,
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
