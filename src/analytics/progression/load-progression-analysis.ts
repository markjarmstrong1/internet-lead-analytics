import "server-only";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { buildProgressionAnalysis } from "./build-progression-analysis";

export async function loadProgressionAnalysis() {
  const dataset = await createServerAnalyticsRepository().load();
  return buildProgressionAnalysis(dataset);
}
