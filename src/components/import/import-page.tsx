"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { normalizeTimelineEvent } from "@/integrations/tekion/timeline/normalize-timeline-event";
import { parseTimeline } from "@/integrations/tekion/timeline/parse-timeline";
import { getImportSourceKey } from "./get-import-source-key";
import type { TekionNormalizedTimelineEvent } from "@/integrations/tekion/timeline/normalized-timeline-event";
import { ImportBatchSummary } from "./import-batch-summary";
import { ImportCsvPreview } from "./import-csv-preview";
import { ImportFilePreview } from "./import-file-preview";
import { parseImportCsv } from "./parse-import-csv";
import type {
  ImportBatch,
  ImportedCsvFile,
  ImportedTimelineFile,
} from "./import-types";

export function ImportPage() {
  const directoryInputRef = useRef<HTMLInputElement>(null);

  const [batch, setBatch] = useState<ImportBatch>({
    timelineFiles: [],
    csvFiles: [],
  });

  const [error, setError] = useState<string | null>(null);

  async function processFiles(files: File[]) {
    setError(null);

    if (files.length === 0) {
      return;
    }

    try {
      const timelineFiles: ImportedTimelineFile[] = [];
      const csvFiles: ImportedCsvFile[] = [];

      for (const file of files) {
        const lowerName = file.name.toLowerCase();

        if (lowerName.endsWith(".txt")) {
          const content = await file.text();
          const parsed = parseTimeline(content, file.name);

          timelineFiles.push({
            sourceKey: getImportSourceKey(file),
            fileName: file.name,
            relativePath: file.webkitRelativePath || file.name,
            events: parsed.map(normalizeTimelineEvent),
          });

          continue;
        }

        if (lowerName.endsWith(".csv")) {
          const content = await file.text();
          const parsed = parseImportCsv(content);

          csvFiles.push({
            sourceKey: getImportSourceKey(file),
            fileName: file.name,
            relativePath: file.webkitRelativePath || file.name,
            headers: parsed.headers,
            rows: parsed.rows,
          });
        }
      }

      if (timelineFiles.length === 0 && csvFiles.length === 0) {
        throw new Error(
          "No supported files were found. Select .txt timeline files or .csv files.",
        );
      }

      setBatch((current) => {
        const existingTimelineKeys = new Set(
          current.timelineFiles.map((file) => file.sourceKey),
        );

        const existingCsvKeys = new Set(
          current.csvFiles.map((file) => file.sourceKey),
        );

        return {
          timelineFiles: [
            ...current.timelineFiles,
            ...timelineFiles.filter(
              (file) => !existingTimelineKeys.has(file.sourceKey),
            ),
          ],
          csvFiles: [
            ...current.csvFiles,
            ...csvFiles.filter(
              (file) => !existingCsvKeys.has(file.sourceKey),
            ),
          ],
        };
      });
    } catch (caught) {
      setBatch({
        timelineFiles: [],
        csvFiles: [],
      });

      setError(
        caught instanceof Error
          ? caught.message
          : "The selected files could not be imported.",
      );
    }
  }

  function handleFileSelection(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const files = Array.from(event.target.files ?? []);

    void processFiles(files);

    event.target.value = "";
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
                Import source data
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Load Tekion timeline files and CSV exports together, inspect
                the source data, and prepare it for the canonical analytics
                model.
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
          <section className="grid gap-6 lg:grid-cols-3">
            <UploadCard
              title="Timeline files"
              description="Select one or many .txt timeline files."
              buttonLabel="Choose timeline files"
              accept=".txt,text/plain"
              multiple
              onChange={handleFileSelection}
            />

            <UploadCard
              title="Timeline folder"
              description="Select a folder containing existing and new .txt files."
              buttonLabel="Choose folder"
              accept=".txt,text/plain"
              inputRef={directoryInputRef}
              directory
              onChange={handleFileSelection}
            />

            <UploadCard
              title="CSV exports"
              description="Select one or many .csv source exports."
              buttonLabel="Choose CSV files"
              accept=".csv,text/csv"
              multiple
              onChange={handleFileSelection}
            />
          </section>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {batch.timelineFiles.length > 0 ||
          batch.csvFiles.length > 0 ? (
            <>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setBatch({
                      timelineFiles: [],
                      csvFiles: [],
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Clear import
                </button>
              </div>
              <ImportBatchSummary batch={batch} />

              <ImportFilePreview batch={batch} />

              <ImportCsvPreview files={batch.csvFiles} />
            </>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                No source data has been imported yet.
              </p>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

type UploadCardProps = {
  title: string;
  description: string;
  buttonLabel: string;
  accept: string;
  multiple?: boolean;
  directory?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

function UploadCard({
  title,
  description,
  buttonLabel,
  accept,
  multiple = false,
  directory = false,
  inputRef,
  onChange,
}: UploadCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex min-h-48 flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <label className="mt-6 cursor-pointer rounded-lg bg-slate-950 px-4 py-3 text-center text-sm font-medium text-white hover:bg-slate-800">
          {buttonLabel}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            className="sr-only"
            onChange={onChange}
            {...(directory ? { webkitdirectory: "" } : {})}
          />
        </label>
      </div>
    </section>
  );
}
