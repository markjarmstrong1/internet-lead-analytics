"use client";

import { useState } from "react";

type MethodRun = {
  id: string;
  method_key: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  result: Record<string, number>;
  error_message: string | null;
};

type Props = {
  initialRuns: MethodRun[];
};

const METHODS = [
  {
    key: "sync-templates",
    title: "Sync Tekion Templates",
    description:
      "Reads the Tekion template catalog stored in the repository and synchronizes it into Supabase. Existing templates keep their permanent IDs.",
    endpoint:
      "/api/methods/sync-templates",
  },
  {
    key: "match-templates",
    title: "Match Timeline Events to Templates",
    description:
      "Compares outbound email and text communications against the known Tekion templates. Dynamic fields, HTML formatting, and personalization are ignored.",
    endpoint:
      "/api/methods/match-templates",
  },
];

function methodKey(
  key: string,
): string {
  return key === "sync-templates"
    ? "sync_tekion_templates"
    : "match_timeline_events";
}

function formatDate(
  value: string | null,
) {
  if (!value) return "Never";

  return new Date(value).toLocaleString();
}

export function MethodsPage({
  initialRuns,
}: Props) {
  const [runs, setRuns] =
    useState(initialRuns);
  const [running, setRunning] =
    useState<string | null>(null);
  const [message, setMessage] =
    useState<string | null>(null);

  async function runMethod(
    method: (typeof METHODS)[number],
  ) {
    setRunning(method.key);
    setMessage(null);

    try {
      const response = await fetch(
        method.endpoint,
        {
          method: "POST",
        },
      );

      const payload =
        (await response.json()) as {
          id?: string;
          result?: Record<
            string,
            number
          >;
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Method failed.",
        );
      }

      setMessage(
        `${method.title} completed successfully.`,
      );

      window.location.reload();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Method failed.",
      );
    } finally {
      setRunning(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Control center
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Methods
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
            Repeatable data-processing methods that
            prepare the analytical dataset. These are
            intentional, inspectable processes — not
            hidden one-time scripts.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            {message}
          </div>
        )}

        <div className="grid gap-6">
          {METHODS.map((method) => {
            const latest = runs.find(
              (run) =>
                run.method_key ===
                methodKey(method.key),
            );

            const isRunning =
              running === method.key;

            return (
              <section
                key={method.key}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-3xl">
                    <h2 className="text-lg font-semibold">
                      {method.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {method.description}
                    </p>

                    {latest && (
                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Status
                          </div>
                          <div className="mt-1 text-sm font-medium">
                            {latest.status}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Last run
                          </div>
                          <div className="mt-1 text-sm">
                            {formatDate(
                              latest.started_at,
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            Result
                          </div>
                          <div className="mt-1 text-sm">
                            {Object.entries(
                              latest.result ?? {},
                            )
                              .map(
                                ([key, value]) =>
                                  `${key}: ${value}`,
                              )
                              .join(" · ") ||
                              "—"}
                          </div>
                        </div>
                      </div>
                    )}

                    {latest?.error_message && (
                      <p className="mt-4 text-sm text-red-400">
                        {latest.error_message}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      runMethod(method)
                    }
                    disabled={isRunning}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isRunning
                      ? "Running..."
                      : "Run method"}
                  </button>
                </div>
              </section>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold">
            How template matching works
          </h2>

          <div className="mt-4 grid gap-5 md:grid-cols-3">
            <div>
              <div className="font-medium">
                1. Start with the real send
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                The method reads the actual outbound
                email or text stored in the timeline.
              </p>
            </div>

            <div>
              <div className="font-medium">
                2. Find distinctive template language
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Personalized fields such as names,
                vehicles, dates, and times are ignored.
                HTML formatting is ignored.
              </p>
            </div>

            <div>
              <div className="font-medium">
                3. Keep only defensible matches
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Strong matches are assigned a template
                ID. Weak or ambiguous matches go to
                review instead of being guessed.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
