import PDFDocument from "pdfkit";
import { loadProgressionAnalysis } from "@/analytics/progression/load-progression-analysis";
import { buildProgressionReport } from "@/analytics/progression/build-progression-report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const report = buildProgressionReport(await loadProgressionAnalysis());
    const doc = new PDFDocument({ size: "LETTER", margin: 48, bufferPages: true, info: { Title: report.title, Author: "MANTIK Management Intelligence" } });
    const chunks: Buffer[] = [];
    const bufferPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });
    const heading = (title: string) => {
      if (doc.y > 690) doc.addPage();
      doc.moveDown(0.7).font("Helvetica-Bold").fontSize(14).fillColor("#172033").text(title);
      doc.moveDown(0.2);
    };
    doc.rect(0, 0, doc.page.width, 7).fill("#244b75");
    doc.moveDown(1.1).font("Helvetica-Bold").fontSize(21).fillColor("#172033").text("MANTIK MANAGEMENT INTELLIGENCE");
    doc.moveDown(0.35).font("Helvetica-Bold").fontSize(17).text(report.title);
    doc.moveDown(0.4).font("Helvetica").fontSize(9).fillColor("#64748b").text(`Generated ${new Date(report.generatedAt).toLocaleString()} · ${report.cohortLeadCount} leads evaluated`);
    for (const section of report.executiveSummary) {
      heading(section.title);
      doc.font("Helvetica").fontSize(10).fillColor("#334155").text(section.summary, { lineGap: 3 });
      for (const line of section.evidence) doc.moveDown(0.15).fontSize(9).text(`• ${line}`, { lineGap: 2 });
    }
    heading("Stage Funnel");
    doc.font("Helvetica").fontSize(9).fillColor("#64748b").text("Stage counts are independent observed populations, not a reconstructed sequential funnel. Transition rates use the eligible prior-stage cohort.");
    for (const stage of report.stageCounts) {
      doc.font("Helvetica").fontSize(10).fillColor("#334155").text(`${stage.stage.replaceAll("_", " ")}: ${stage.count} observed leads · ${stage.progressedFromPreviousCount === null ? "cohort baseline" : `${stage.progressedFromPreviousCount}/${stage.eligibleCount} eligible leads progressed`} · observed transition rate: ${stage.rateFromPrevious === null ? "not calculable" : (stage.rateFromPrevious * 100).toFixed(1) + "%"}`);
    }
    heading("Strongest Observed Associations");
    for (const item of report.strongestAssociations) {
      doc.font("Helvetica").fontSize(9).fillColor("#334155").text(`${item.factor}: with factor ${item.progressedWithFactor}/${item.exposedLeadCount}; without factor ${item.progressedWithoutFactor}/${item.unexposedLeadCount}; difference ${item.rateDifference === null ? "n/a" : (item.rateDifference * 100).toFixed(1) + " pp"}`);
    }
    heading("Methodology and Limitations");
    doc.font("Helvetica").fontSize(9).fillColor("#334155").text(report.methodology.associationDescription);
    for (const item of report.methodology.limitations) doc.moveDown(0.15).text(`• ${item}`);
    doc.end();
    const buffer = await bufferPromise;
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="mantik-what-is-moving-leads-forward.pdf"',
      "Cache-Control": "no-store",
    }});
  } catch (error) {
    console.error("Progression PDF export failed", error);
    return new Response("Unable to generate progression report PDF.", { status: 500 });
  }
}
