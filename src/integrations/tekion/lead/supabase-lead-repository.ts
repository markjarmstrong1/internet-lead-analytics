import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import type { LeadPersistenceRow } from "./lead-persistence-row";

export type LeadListItem = LeadPersistenceRow & {
  id: string;
  created_at: string;
  updated_at: string;
};

export async function listLeads(): Promise<LeadListItem[]> {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("creation_time", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  return data ?? [];
}
