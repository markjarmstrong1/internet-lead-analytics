import { createClient } from "@supabase/supabase-js";

import { loadAnalyticsPage } from "@/analytics/load-analytics-page";
import { PageHeader } from "@/components/app/page-header";
import { AppShell } from "@/components/app/app-shell";
import { MethodsPage } from "@/components/methods/methods-page";
import { loadTemplateAnalytics } from "@/methods/template-analytics";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase server configuration.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default async function MethodsRoute() {
  const supabase = getAdminClient();

  const [analytics, runsResult, templatesResult, metrics] =
    await Promise.all([
      loadAnalyticsPage({}),
      supabase
        .from("method_runs")
        .select(
          "id,method_key,status,started_at,completed_at,result,error_message",
        )
        .order("started_at", {
          ascending: false,
        })
        .limit(20),
      supabase
        .from("templates")
        .select(
          "id,template_code,name,description,subject,content,is_active,source_kind,source_path,external_template_key,created_at,updated_at",
        )
        .order("source_kind")
        .order("template_code"),
      loadTemplateAnalytics(supabase),
    ]);

  if (runsResult.error) {
    throw runsResult.error;
  }

  if (templatesResult.error) {
    throw templatesResult.error;
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1500px] space-y-7 px-6 py-7 lg:px-8">
        <PageHeader
          eyebrow="Management intelligence"
          title="Internet lead intelligence"
          description="Understand what actually happens after an Internet lead arrives — using observed communication evidence rather than CRM status alone."
        />

        <MethodsPage
          initialAnalysis={analytics.analysis}
          initialRuns={runsResult.data ?? []}
          initialTemplates={templatesResult.data ?? []}
          initialMetrics={metrics}
        />
      </div>
    </AppShell>
  );
}
