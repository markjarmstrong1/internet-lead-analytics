import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";

import { SupabaseReportRepository } from "./report-repository";

export function createServerReportRepository() {
  return new SupabaseReportRepository(
    createServerSupabaseClient(),
  );
}
