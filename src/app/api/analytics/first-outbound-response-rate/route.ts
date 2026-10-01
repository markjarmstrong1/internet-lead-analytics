import { NextResponse } from "next/server";

import { getFirstOutboundResponseRate } from "@/analytics/metrics/get-first-outbound-response-rate";

export async function GET() {
  try {
    const metric = await getFirstOutboundResponseRate();

    return NextResponse.json({
      ok: true,
      metric,
    });
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "The metric could not be calculated.";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
