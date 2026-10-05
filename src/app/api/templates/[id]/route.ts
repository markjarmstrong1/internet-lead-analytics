import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server configuration.");
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      name?: unknown;
      description?: unknown;
      subject?: unknown;
      content?: unknown;
      isActive?: unknown;
    };

    const payload: Record<string, string | boolean | null> = {};

    if ("name" in body) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        return NextResponse.json(
          { error: "Name is required." },
          { status: 400 },
        );
      }
      payload.name = body.name.trim();
    }

    if ("description" in body) {
      payload.description =
        typeof body.description === "string" ? body.description : "";
    }

    if ("subject" in body) {
      payload.subject =
        typeof body.subject === "string" && body.subject.trim()
          ? body.subject
          : null;
    }

    if ("content" in body) {
      if (typeof body.content !== "string") {
        return NextResponse.json(
          { error: "Content must be text." },
          { status: 400 },
        );
      }
      payload.content = body.content;
    }

    if ("isActive" in body) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json(
          { error: "isActive must be boolean." },
          { status: 400 },
        );
      }
      payload.is_active = body.isActive;
    }

    payload.updated_at = new Date().toISOString();

    const { data, error } = await getAdminClient()
      .from("templates")
      .update(payload)
      .eq("id", id)
      .select(
        "id,template_code,name,description,subject,content,is_active,source_kind,source_path,external_template_key,created_at,updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Template update failed.",
      },
      { status: 500 },
    );
  }
}
