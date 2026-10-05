import { createClient } from "@supabase/supabase-js";

import { MethodsPage } from "@/components/methods/methods-page";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

  const { data, error } =
    await supabase
      .from("method_runs")
      .select(
        "id,method_key,status,started_at,completed_at,result,error_message",
      )
      .order("started_at", {
        ascending: false,
      })
      .limit(20);

  if (error) {
    throw error;
  }

  return (
    <MethodsPage
      initialRuns={data ?? []}
    />
  );
}
