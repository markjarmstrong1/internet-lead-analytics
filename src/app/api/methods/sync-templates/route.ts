import { NextResponse } from "next/server";

import { runMethod } from "@/methods/template-methods";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const result = await runMethod(
      "sync_tekion_templates",
    );

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Template sync failed.",
      },
      { status: 500 },
    );
  }
}
