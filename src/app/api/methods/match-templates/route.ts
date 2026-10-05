import { NextResponse } from "next/server";

import { runMethod } from "@/methods/template-methods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runMethod(
      "match_timeline_events",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Template matching failed.",
      },
      { status: 500 },
    );
  }
}
