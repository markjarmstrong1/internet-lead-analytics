import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ leads: [] });
  }

  const supabase = createServerSupabaseClient();
  const pattern = `%${query.replace(/[%_]/g, "\\$&")}%`;

  const { data, error } = await supabase
    .from("leads")
    .select(
      "id, contact_name, external_record_id, source, status, stage",
    )
    .or(
      `contact_name.ilike.${pattern},external_record_id.ilike.${pattern},source.ilike.${pattern}`,
    )
    .order("creation_time", {
      ascending: false,
      nullsFirst: false,
    })
    .limit(8);

  if (error) {
    return NextResponse.json(
      { error: "Failed to search leads." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    leads: (data ?? []).map((lead) => ({
      id: lead.id,
      name: lead.contact_name?.trim() || "Unnamed lead",
      leadId: lead.external_record_id ?? "",
      source: lead.source ?? "",
      status: lead.status ?? "",
      stage: lead.stage ?? "",
    })),
  });
}
