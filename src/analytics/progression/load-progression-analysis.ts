import "server-only";
import { createServerAnalyticsRepository } from "@/analytics/data/create-server-analytics-repository";
import { createServerSupabaseClient } from "@/lib/supabase/server-client";
import { PROGRESSION_STAGES, type ProgressionRule, type ProgressionStage } from "./progression-types";
import { DEFAULT_PROGRESSION_RULES } from "./progression-rules";
import { buildProgressionAnalysis } from "./build-progression-analysis";

function normalizeRules(rows: Array<{
  rule_key: string; stage_key: string; version: number; label: string; description: string;
  qualification_basis: string; is_active: boolean;
}>): ProgressionRule[] {
  return rows.filter((row) => PROGRESSION_STAGES.includes(row.stage_key as ProgressionStage))
    .filter((row) => typeof row.rule_key === "string" && row.rule_key.trim().length > 0)
    .filter((row) => Number.isInteger(row.version) && row.version > 0)
    .filter((row) => typeof row.label === "string" && row.label.trim().length > 0)
    .filter((row) => typeof row.description === "string" && row.description.trim().length > 0)
    .filter((row) => ["source_record", "observed_event", "source_outcome"].includes(row.qualification_basis))
    .map((row) => ({
      ruleKey: row.rule_key, stage: row.stage_key as ProgressionStage, version: row.version,
      label: row.label, description: row.description,
      qualificationBasis: row.qualification_basis as ProgressionRule["qualificationBasis"],
      isActive: row.is_active,
    }));
}

export async function loadProgressionAnalysis() {
  const dataset = await createServerAnalyticsRepository().load();
  let rules = DEFAULT_PROGRESSION_RULES;
  try {
    const result = await createServerSupabaseClient().from("progression_rule_definitions")
      .select("rule_key,stage_key,version,label,description,qualification_basis,is_active")
      .eq("is_active", true).order("stage_key").order("version", { ascending: false });
    if (result.error) throw result.error;
    const latestByStage = new Map<string, (typeof result.data)[number]>();
    for (const row of result.data ?? []) if (!latestByStage.has(row.stage_key)) latestByStage.set(row.stage_key, row);
    const configured = normalizeRules([...latestByStage.values()]);
    const configuredByStage = new Map(configured.map((rule) => [rule.stage, rule]));
    // Keep a complete six-stage rule set even when the database contains only a partial configuration.
    rules = DEFAULT_PROGRESSION_RULES.map((fallback) => configuredByStage.get(fallback.stage) ?? fallback);
  } catch (error) {
    // Local development can run before the migration is applied; defaults are versioned and explicit.
    console.warn("Progression rules table unavailable; using bundled rule definitions.", error);
  }
  return buildProgressionAnalysis(dataset, rules);
}
