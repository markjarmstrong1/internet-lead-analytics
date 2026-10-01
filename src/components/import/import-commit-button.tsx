"use client";

import { useState } from "react";

import type { ImportBatch } from "./import-types";
import { ImportCommitResult } from "./import-commit-result";
import type { TimelineImportExecutionResult } from "@/integrations/import/execute-timeline-import-sync";

type ImportCommitButtonProps = {
  batch: ImportBatch;
};

export function ImportCommitButton({
  batch,
}: ImportCommitButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] =
    useState<TimelineImportExecutionResult | null>(null);

  const hasTimelineData = batch.timelineFiles.length > 0;

  async function commitImport() {
    if (!hasTimelineData || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/import/timeline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timelineFiles: batch.timelineFiles,
          csvFiles: [],
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        result?: TimelineImportExecutionResult;
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.result) {
        throw new Error(
          payload.error ??
            "The timeline import could not be completed.",
        );
      }

      setResult(payload.result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The timeline import could not be completed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Ready to commit
            </p>

            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Synchronize timeline data
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Review the source files above, then reconcile the timeline
              records and events against the canonical database.
            </p>
          </div>

          <button
            type="button"
            disabled={!hasTimelineData || isSubmitting}
            onClick={() => void commitImport()}
            className="shrink-0 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Committing..."
              : "Commit timeline data"}
          </button>
        </div>

        {batch.csvFiles.length > 0 ? (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            CSV files are currently preview-only. They will not be persisted
            by this commit.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      {result ? (
        <ImportCommitResult result={result} />
      ) : null}
    </div>
  );
}
