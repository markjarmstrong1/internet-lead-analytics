import { NextResponse } from "next/server";

import { runTimelineImport } from "@/integrations/import/run-timeline-import";
import type { ImportBatch } from "@/integrations/import/import-batch";

export async function POST(request: Request) {
  try {
    const batch = (await request.json()) as ImportBatch;

    if (!batch || !Array.isArray(batch.timelineFiles)) {
      return NextResponse.json(
        {
          error: "A valid timeline import batch is required.",
        },
        { status: 400 },
      );
    }

    const result = await runTimelineImport({
      timelineFiles: batch.timelineFiles,
      csvFiles: Array.isArray(batch.csvFiles)
        ? batch.csvFiles
        : [],
    });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "The timeline import could not be completed.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
