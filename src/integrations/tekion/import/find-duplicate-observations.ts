import type { TekionSourceObservation } from "./source-observation";

export type DuplicateObservation = {
  sourceSystem: string;
  sourceType: string;
  sourceRecordId: string;
  count: number;
};

export function findDuplicateObservations(
  observations: TekionSourceObservation[],
): DuplicateObservation[] {
  const counts = new Map<string, DuplicateObservation>();

  for (const observation of observations) {
    const key = [
      observation.sourceSystem,
      observation.sourceType,
      observation.sourceRecordId,
    ].join("|");

    const existing = counts.get(key);

    if (existing) {
      existing.count += 1;
      continue;
    }

    counts.set(key, {
      sourceSystem: observation.sourceSystem,
      sourceType: observation.sourceType,
      sourceRecordId: observation.sourceRecordId,
      count: 1,
    });
  }

  return [...counts.values()].filter(
    (observation) => observation.count > 1,
  );
}