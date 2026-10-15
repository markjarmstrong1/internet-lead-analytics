import { NextResponse } from "next/server";
import { loadProgressionAnalysis } from "@/analytics/progression/load-progression-analysis";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const analysis = await loadProgressionAnalysis();
    return NextResponse.json({
      ...analysis,
      leads: analysis.leads.map(({ lead, entries, evidenceCoverage, events }) => ({
        leadId: lead.leadId,
        source: lead.source,
        sourceGroup: lead.sourceGroup,
        creationTime: lead.creationTime,
        timelineRecordIds: lead.timelineRecordIds,
        entries,
        evidenceCoverage,
        events: events.map(({ timelineRecordId, sourceEventId, sourceFile, occurredAt, rawType, actorType, category, channel, direction, details, templateCode }) => ({
          timelineRecordId, sourceEventId, sourceFile, occurredAt, rawType, actorType, category, channel, direction, details, templateCode,
        })),
      })),
    });
  } catch (error) {
    console.error("Progression analysis failed", error);
    return NextResponse.json({ error: "Unable to load progression analysis." }, { status: 500 });
  }
}
