"use client";

import Link from "next/link";
import { useState } from "react";
import { normalizeTimelineEvent } from "@/integrations/tekion/timeline/normalize-timeline-event";
import { parseTimeline } from "@/integrations/tekion/timeline/parse-timeline";
import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";
import { ImportEventPreview } from "./import-event-preview";
import { ImportSummary } from "./import-summary";

export function ImportPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [events, setEvents] = useState<TekionNormalizedTimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);

    if (!file.name.toLowerCase().endsWith(".txt")) {
      setError("Please select a Tekion timeline .txt file.");
      return;
    }

    try {
      const content = await file.text();
      const parsed = parseTimeline(content, file.name);
      const normalized = parsed.map(normalizeTimelineEvent);

      setFileName(file.name);
      setEvents(normalized);
    } catch (caught) {
      setEvents([]);
      setFileName(null);
      setError(
        caught instanceof Error
          ? caught.message
          : "The timeline file could not be imported.",
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                Data ingestion
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                Import timeline data
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
                Import a Tekion timeline .txt file and inspect the normalized
                events before they become part of the analytics model.
              </p>
            </div>

            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back to dashboard
            </Link>
          </div>
        </header>

        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <label
              htmlFor="timeline-file"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 px-6 py-12 text-center hover:border-slate-400"
            >
              <span className="text-base font-semibold text-slate-950">
                Select a Tekion timeline file
              </span>

              <span className="mt-2 text-sm text-slate-500">
                .txt files only. The file is parsed locally in this first
                import step.
              </span>

              <span className="mt-5 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white">
                Choose file
              </span>

              <input
                id="timeline-file"
                type="file"
                accept=".txt,text/plain"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void handleFile(file);
                  }
                }}
              />
            </label>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            ) : null}
          </section>

          {fileName ? (
            <>
              <ImportSummary
                fileName={fileName}
                events={events}
              />

              <ImportEventPreview events={events} />
            </>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                No timeline has been imported yet.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
