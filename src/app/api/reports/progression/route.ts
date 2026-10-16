import { NextResponse } from "next/server";
import { loadProgressionAnalysis } from "@/analytics/progression/load-progression-analysis";
import { buildProgressionReport } from "@/analytics/progression/build-progression-report";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(buildProgressionReport(await loadProgressionAnalysis()));
  } catch (error) {
    console.error("Progression report failed", error);
    return NextResponse.json({ error: "Unable to generate progression report." }, { status: 500 });
  }
}
