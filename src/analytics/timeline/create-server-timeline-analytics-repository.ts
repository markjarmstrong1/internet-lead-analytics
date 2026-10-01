import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { SupabaseTimelineAnalyticsRepository } from "./supabase-timeline-analytics-repository";

export function createServerTimelineAnalyticsRepository() {
  return new SupabaseTimelineAnalyticsRepository(
    createServerSupabaseClient(),
  );
}
