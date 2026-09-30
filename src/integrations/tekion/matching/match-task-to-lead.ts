import { nameContainsLeadName } from "./normalize-name";
import {
  getMatchingFeatures,
  type MatchFeatureInput,
} from "./match-features";

export type TaskLeadMatchInput = MatchFeatureInput & {
  taskName: string;
  leadName: string;
};

export type TaskLeadMatchResult = {
  status: "matched" | "unmatched";
  features: string[];
};

export function matchTaskToLead(
  input: TaskLeadMatchInput,
): TaskLeadMatchResult {
  const nameMatches = nameContainsLeadName(
    input.taskName,
    input.leadName,
  );

  if (!nameMatches) {
    return {
      status: "unmatched",
      features: [],
    };
  }

  const features = getMatchingFeatures(input);

  if (features.length === 0) {
    return {
      status: "unmatched",
      features: [],
    };
  }

  return {
    status: "matched",
    features,
  };
}