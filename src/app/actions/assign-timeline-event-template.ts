"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export async function assignTimelineEventTemplate(
  eventId: string,
  templateCode: string | null,
): Promise<{ success: true } | { success: false; error: string }> {
  if (!eventId.trim()) {
    return { success: false, error: "Missing timeline event ID." };
  }

  const supabase = createServerSupabaseClient();

  if (templateCode !== null) {
    const { data: template, error: templateError } = await supabase
      .from("templates")
      .select("template_code")
      .eq("template_code", templateCode)
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      return { success: false, error: "Choose an active template from the list." };
    }
  }

  const { error } = await supabase
    .from("timeline_events")
    .update({ template_code: templateCode })
    .eq("id", eventId);

  if (error) {
    return { success: false, error: `Could not save template: ${error.message}` };
  }

  return { success: true };
}
