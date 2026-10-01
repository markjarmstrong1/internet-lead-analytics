export type ImportReconciliationStatus =
  | "new"
  | "updated"
  | "unchanged"
  | "invalid";

export type ImportReconciliationItem<T> = {
  status: ImportReconciliationStatus;
  incoming: T;
  existing?: T;
  reason?: string;
};

export type ImportReconciliationSummary = {
  total: number;
  newCount: number;
  updatedCount: number;
  unchangedCount: number;
  invalidCount: number;
};

export type ImportReconciliationResult<T> = {
  items: ImportReconciliationItem<T>[];
  summary: ImportReconciliationSummary;
};

type ReconcileOptions<T> = {
  getIdentity: (record: T) => string | null;
  isEqual: (incoming: T, existing: T) => boolean;
};

export function reconcileImportRecords<T>(
  incomingRecords: T[],
  existingRecords: T[],
  options: ReconcileOptions<T>,
): ImportReconciliationResult<T> {
  const existingByIdentity = new Map<string, T>();

  for (const existing of existingRecords) {
    const identity = options.getIdentity(existing);

    if (identity) {
      existingByIdentity.set(identity, existing);
    }
  }

  const items: ImportReconciliationItem<T>[] = [];

  for (const incoming of incomingRecords) {
    const identity = options.getIdentity(incoming);

    if (!identity) {
      items.push({
        status: "invalid",
        incoming,
        reason: "The record does not contain a stable source identity.",
      });

      continue;
    }

    const existing = existingByIdentity.get(identity);

    if (!existing) {
      items.push({
        status: "new",
        incoming,
      });

      continue;
    }

    items.push({
      status: options.isEqual(incoming, existing)
        ? "unchanged"
        : "updated",
      incoming,
      existing,
    });
  }

  return {
    items,
    summary: summarizeImportReconciliation(items),
  };
}

function summarizeImportReconciliation<T>(
  items: ImportReconciliationItem<T>[],
): ImportReconciliationSummary {
  return {
    total: items.length,
    newCount: items.filter((item) => item.status === "new").length,
    updatedCount: items.filter((item) => item.status === "updated").length,
    unchangedCount: items.filter((item) => item.status === "unchanged")
      .length,
    invalidCount: items.filter((item) => item.status === "invalid").length,
  };
}
