import "server-only";

import { createSupabaseClient } from "@/lib/supabase/client";
import type { LeadPersistenceRow } from "./lead-persistence-row";

export type LeadListItem = LeadPersistenceRow & {
  id: string;
  created_at: string;
  updated_at: string;
};

export async function listLeads(): Promise<LeadListItem[]> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("creation_time", { ascending: false });

  if (error) {
    throw new Error(`Failed to load leads: ${error.message}`);
  }

  return data ?? [];
}
