import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { SupabaseAnalyticsRepository } from "./analytics-repository";

export function createServerAnalyticsRepository() {
  return new SupabaseAnalyticsRepository(
    createServerSupabaseClient(),
  );
}
