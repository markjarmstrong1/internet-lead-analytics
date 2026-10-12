import { NextResponse } from "next/server";

import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildReport } from "@/reports/build-report";
import { normalizeReportDefinition } from "@/reports/report-definition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const definition = normalizeReportDefinition(body);
    const dataset = await createServerAnalyticsRepository().load();
    const result = buildReport(dataset, definition);

    return NextResponse.json({
      populationCount: result.populationCount,
      summary: result.summary,
      rows: result.rows,
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid report preview request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
