"use client";

import type { TaskWorkflowReportFilter } from "@/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-filter";

type WorkflowFiltersProps = {
  filter: TaskWorkflowReportFilter;
  workflowTitles: string[];
  onChange: (filter: TaskWorkflowReportFilter) => void;
};

const completionOptions = [
  ["completed_automatically", "Automatically completed"],
  ["completed_manually", "Manually completed"],
  ["dismissed", "Dismissed"],
  ["overdue", "Overdue"],
  ["pending", "Pending"],
  ["unknown", "Unknown"],
] as const;

const identityOptions = [
  ["direct_match", "Direct identity"],
  ["unresolved_variant", "Unresolved identity"],
  ["no_match", "No identity match"],
] as const;

const communicationOptions = [
  ["qualifying_outbound", "Qualifying outbound"],
  ["outbound_channel_mismatch", "Channel mismatch"],
  ["inbound_only", "Inbound only"],
  ["no_communication_evidence", "No communication evidence"],
  ["window_unavailable", "Window unavailable"],
  ["window_invalid", "Window invalid"],
  ["not_evaluated", "Not evaluated"],
] as const;

const channelOptions = [
  ["email", "Email"],
  ["text", "Text"],
  ["phone", "Phone"],
  ["voicemail", "Voicemail"],
] as const;

const timelineOptions = [
  ["ana_yu.txt", "ana_yu"],
  ["anthony_bacon.txt", "anthony_bacon"],
  ["jeffery_becker.txt", "jeffery_becker"],
  ["jim_wilson.txt", "jim_wilson"],
] as const;

function toggleValue<T extends string>(
  values: T[] | undefined,
  value: T,
): T[] | undefined {
  const current = values ?? [];

  if (current.includes(value)) {
    const next = current.filter((item) => item !== value);
    return next.length > 0 ? next : undefined;
  }

  return [...current, value];
}

export function WorkflowFilters({
  filter,
  workflowTitles,
  onChange,
}: WorkflowFiltersProps) {
  const activeFilterCount = Object.values(filter).filter(
    (values) => values !== undefined && values.length > 0,
  ).length;

  const update = <K extends keyof TaskWorkflowReportFilter>(
    key: K,
    value: TaskWorkflowReportFilter[K],
  ) => {
    onChange({
      ...filter,
      [key]: value,
    });
  };

  const clear = () => onChange({});

  return (
    <div className="border-b border-slate-200 bg-white px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter.taskTitles?.[0] ?? ""}
          onChange={(event) =>
            update(
              "taskTitles",
              event.target.value
                ? [event.target.value]
                : undefined,
            )
          }
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          aria-label="Workflow filter"
        >
          <option value="">All workflows</option>
          {workflowTitles.map((title) => (
            <option key={title} value={title}>
              {title}
            </option>
          ))}
        </select>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Completion
          </summary>
          <FilterMenu>
            {completionOptions.map(([value, label]) => (
              <Checkbox
                key={value}
                label={label}
                checked={filter.completionModes?.includes(value) ?? false}
                onChange={() =>
                  update(
                    "completionModes",
                    toggleValue(filter.completionModes, value),
                  )
                }
              />
            ))}
          </FilterMenu>
        </details>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Identity
          </summary>
          <FilterMenu>
            {identityOptions.map(([value, label]) => (
              <Checkbox
                key={value}
                label={label}
                checked={filter.identityStatuses?.includes(value) ?? false}
                onChange={() =>
                  update(
                    "identityStatuses",
                    toggleValue(filter.identityStatuses, value),
                  )
                }
              />
            ))}
          </FilterMenu>
        </details>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Communication
          </summary>
          <FilterMenu>
            {communicationOptions.map(([value, label]) => (
              <Checkbox
                key={value}
                label={label}
                checked={
                  filter.communicationStatuses?.includes(value) ?? false
                }
                onChange={() =>
                  update(
                    "communicationStatuses",
                    toggleValue(
                      filter.communicationStatuses,
                      value,
                    ),
                  )
                }
              />
            ))}
          </FilterMenu>
        </details>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Allowed channel
          </summary>
          <FilterMenu>
            {channelOptions.map(([value, label]) => (
              <Checkbox
                key={value}
                label={label}
                checked={filter.allowedChannels?.includes(value) ?? false}
                onChange={() =>
                  update(
                    "allowedChannels",
                    toggleValue(filter.allowedChannels, value),
                  )
                }
              />
            ))}
          </FilterMenu>
        </details>

        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
            Timeline source
          </summary>
          <FilterMenu>
            {timelineOptions.map(([value, label]) => (
              <Checkbox
                key={value}
                label={label}
                checked={
                  filter.timelineSourceFiles?.includes(value) ?? false
                }
                onChange={() =>
                  update(
                    "timelineSourceFiles",
                    toggleValue(
                      filter.timelineSourceFiles,
                      value,
                    ),
                  )
                }
              />
            ))}
          </FilterMenu>
        </details>

        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FilterMenu({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-full z-20 mt-2 min-w-56 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-slate-300"
      />
      {label}
    </label>
  );
}
