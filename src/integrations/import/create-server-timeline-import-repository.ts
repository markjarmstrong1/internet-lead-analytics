import "server-only";

import { SupabaseTimelineImportRepository } from "./supabase-timeline-import-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";

export function createServerTimelineImportRepository() {
  return new SupabaseTimelineImportRepository(
    createServerSupabaseClient(),
  );
}
