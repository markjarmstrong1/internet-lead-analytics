import type { TekionSourceObservation } from "./source-observation";
import { findDuplicateObservations } from "./find-duplicate-observations";

export type ImportValidationResult = {
  valid: boolean;
  observationCount: number;
  duplicateObservations: ReturnType<
    typeof findDuplicateObservations
  >;
};

export function validateImportObservations(
  observations: TekionSourceObservation[],
): ImportValidationResult {
  const duplicateObservations =
    findDuplicateObservations(observations);

  return {
    valid: duplicateObservations.length === 0,
    observationCount: observations.length,
    duplicateObservations,
  };
}