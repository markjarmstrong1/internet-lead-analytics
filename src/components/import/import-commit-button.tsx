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

  const hasImportData =
    batch.timelineFiles.length > 0 ||
    batch.csvFiles.length > 0;

  async function commitImport() {
    if (!hasImportData || isSubmitting) {
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
          csvFiles: batch.csvFiles,
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
            "The Tekion import could not be completed.",
        );
      }

      setResult(payload.result);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The Tekion import could not be completed.",
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
              Synchronize Tekion data
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Persist canonical leads, raw task observations, and
              timeline evidence from the files above.
            </p>
          </div>

          <button
            type="button"
            disabled={!hasImportData || isSubmitting}
            onClick={() => void commitImport()}
            className="shrink-0 rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "Committing..."
              : "Commit Tekion data"}
          </button>
        </div>

        {batch.csvFiles.length > 0 ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            CSV files will now be persisted. Lead CSV rows become
            canonical leads; task CSV rows are preserved as raw source
            observations.
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