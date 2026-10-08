import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

import {
  loadTekionTemplateCatalog,
} from "./tekion-template-catalog";

import {
  matchCommunicationToTemplates,
  TEMPLATE_MATCHER_VERSION,
  type TemplateCandidate,
} from "./template-matching";

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function describeMethodError(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };

    if (typeof value.message === "string" && value.message.trim()) {
      const code =
        typeof value.code === "string" ? ` [${value.code}]` : "";
      const extra = [
        value.details,
        value.hint,
      ].filter(
        (part): part is string =>
          typeof part === "string" && Boolean(part.trim()),
      );

      return `${value.message}${code}${
        extra.length ? ` — ${extra.join(" ")}` : ""
      }`;
    }
  }

  return fallback;
}

export async function syncTekionTemplates(): Promise<{
  discovered: number;
  created: number;
  updated: number;
}> {
  const supabase = adminClient();
  const catalog = loadTekionTemplateCatalog();

  const { data: existing, error } =
    await supabase
      .from("templates")
      .select(
        "id,external_template_key,source_path",
      );

  if (error) {
    throw error;
  }

  const existingByKey = new Map(
    (existing ?? []).map((row) => [
      row.external_template_key,
      row,
    ]),
  );

  let created = 0;
  let updated = 0;

  for (const template of catalog) {
    const existingRow =
      existingByKey.get(
        template.externalTemplateKey,
      );

    const payload = {
      name: template.name,
      description: template.description,
      content: template.content,
      subject: template.subject,
      external_template_key:
        template.externalTemplateKey,
      source_path: template.sourcePath,
      source_kind: template.sourceKind,
      normalized_content:
        template.normalizedContent,
      normalized_subject:
        template.normalizedSubject,
      metadata: template.metadata,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    if (existingRow) {
      const { error: updateError } =
        await supabase
          .from("templates")
          .update(payload)
          .eq("id", existingRow.id);

      if (updateError) {
        throw updateError;
      }

      updated += 1;
    } else {
      const { error: insertError } =
        await supabase
          .from("templates")
          .insert(payload);

      if (insertError) {
        throw insertError;
      }

      created += 1;
    }
  }

  return {
    discovered: catalog.length,
    created,
    updated,
  };
}

function extractEventCommunication(
  event: {
    details: string;
    metadata: Record<string, unknown> | null;
    raw_data: Record<string, unknown> | null;
  },
): {
  body: string;
  subject: string | null;
} {
  const metadata =
    event.metadata ?? {};
  const rawData =
    event.raw_data ?? {};

  const subjectCandidates = [
    metadata.subject,
    metadata.emailSubject,
    metadata.email_subject,
    rawData.subject,
    rawData.emailSubject,
    rawData.email_subject,
  ];

  let subject =
    subjectCandidates.find(
      (value): value is string =>
        typeof value === "string" &&
        Boolean(value.trim()),
    ) ?? null;

  const detailSubject =
    event.details.match(
      /(?:^|\n)\s*Subject:\s*(.+?)(?:\n|$)/i,
    )?.[1];

  if (!subject && detailSubject) {
    subject = detailSubject.trim();
  }

  const bodyCandidates = [
    metadata.body,
    metadata.message,
    metadata.content,
    rawData.body,
    rawData.message,
    rawData.content,
    event.details,
  ];

  const body =
    bodyCandidates.find(
      (value): value is string =>
        typeof value === "string" &&
        value.trim().length > 0,
    ) ?? "";

  return {
    body,
    subject,
  };
}

export async function matchTimelineEventsToTemplates(): Promise<{
  analyzed: number;
  matched: number;
  review: number;
  unmatched: number;
}> {
  const supabase = adminClient();

  const { data: templateRows, error: templateError } =
    await supabase
      .from("templates")
      .select(
        "id,name,source_kind,content,subject,normalized_content,normalized_subject",
      )
      .eq("is_active", true);

  if (templateError) {
    throw templateError;
  }

  const templates: TemplateCandidate[] =
    (templateRows ?? []).map((row) => ({
      templateId: row.id,
      templateName: row.name,
      sourceKind:
        row.source_kind === "email"
          ? "email"
          : "text",
      content: row.content ?? "",
      subject: row.subject ?? null,
      normalizedContent:
        row.normalized_content ?? "",
      normalizedSubject:
        row.normalized_subject ?? null,
    }));

  type MatchableTimelineEvent = {
    id: string;
    details: string;
    metadata: Record<string, unknown> | null;
    raw_data: Record<string, unknown> | null;
    channel: string | null;
    direction: string | null;
    actor_type: string | null;
  };

  // Supabase REST responses are capped. Fetch stable pages so
  // larger imports cannot silently omit eligible communications.
  const events: MatchableTimelineEvent[] = [];
  const pageSize = 500;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("timeline_events")
      .select(
        "id,details,metadata,raw_data,channel,direction,actor_type",
      )
      .eq("direction", "outbound")
      .in("channel", ["email", "text"])
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const page = (data ?? []) as MatchableTimelineEvent[];
    events.push(...page);

    if (page.length < pageSize) {
      break;
    }
  }

  let matched = 0;
  let review = 0;
  let unmatched = 0;

  const rows = (events ?? []).map((event) => {
    const communication =
      extractEventCommunication(event);

    const channel =
      event.channel === "email"
        ? "email"
        : "text";

    const channelTemplates =
      templates.filter(
        (template) =>
          template.sourceKind === channel,
      );

    const result =
      matchCommunicationToTemplates(
        communication.body,
        communication.subject,
        channelTemplates,
      );

    if (result.status === "matched") {
      matched += 1;
    } else if (result.status === "review") {
      review += 1;
    } else {
      unmatched += 1;
    }

    return {
      timeline_event_id: event.id,
      template_id: result.templateId,
      match_status: result.status,
      match_score: result.score,
      runner_up_score:
        result.runnerUpScore,
      match_method: result.method,
      matched_fragment:
        result.matchedFragment,
      evidence: {
        ...result.evidence,
        subject:
          communication.subject,
      },
      matcher_version:
        TEMPLATE_MATCHER_VERSION,
      matched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });

  /*
   * Upsert in small batches instead of deleting all matches through
   * one enormous .in(...) request. Existing results remain available
   * if any batch fails. Remove stale rows only after all writes pass.
   */
  const existingMatchIds: string[] = [];

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase
      .from("timeline_event_template_matches")
      .select("timeline_event_id")
      .order("timeline_event_id", { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (error) {
      throw error;
    }

    const page = data ?? [];
    existingMatchIds.push(
      ...page.map((row) => row.timeline_event_id),
    );

    if (page.length < pageSize) {
      break;
    }
  }

  const writeBatchSize = 100;

  for (let offset = 0; offset < rows.length; offset += writeBatchSize) {
    const batch = rows.slice(offset, offset + writeBatchSize);

    const { error } = await supabase
      .from("timeline_event_template_matches")
      .upsert(batch, { onConflict: "timeline_event_id" });

    if (error) {
      throw error;
    }
  }

  const currentEventIds = new Set(events.map((event) => event.id));
  const staleIds = existingMatchIds.filter(
    (id) => !currentEventIds.has(id),
  );

  for (let offset = 0; offset < staleIds.length; offset += writeBatchSize) {
    const batch = staleIds.slice(offset, offset + writeBatchSize);

    const { error } = await supabase
      .from("timeline_event_template_matches")
      .delete()
      .in("timeline_event_id", batch);

    if (error) {
      throw error;
    }
  }

  return {
    analyzed: rows.length,
    matched,
    review,
    unmatched,
  };
}

export async function getLatestMethodRuns() {
  const supabase = adminClient();

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

  return data ?? [];
}

export async function runMethod(
  methodKey:
    | "sync_tekion_templates"
    | "match_timeline_events",
) {
  const supabase = adminClient();

  const { data: run, error: createError } =
    await supabase
      .from("method_runs")
      .insert({
        method_key: methodKey,
        status: "running",
        result: {},
      })
      .select("id")
      .single();

  if (createError) {
    throw createError;
  }

  try {
    const result =
      methodKey ===
      "sync_tekion_templates"
        ? await syncTekionTemplates()
        : await matchTimelineEventsToTemplates();

    const { error: updateError } =
      await supabase
        .from("method_runs")
        .update({
          status: "completed",
          completed_at:
            new Date().toISOString(),
          result,
        })
        .eq("id", run.id);

    if (updateError) {
      throw updateError;
    }

    return {
      id: run.id,
      result,
    };
  } catch (error) {
    const message = describeMethodError(
      error,
      "Unknown method failure.",
    );

    await supabase
      .from("method_runs")
      .update({
        status: "failed",
        completed_at:
          new Date().toISOString(),
        error_message: message,
      })
      .eq("id", run.id);

    throw error;
  }
}
