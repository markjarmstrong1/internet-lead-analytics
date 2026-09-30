export type MatchFeatureInput = {
  taskYear?: string;
  leadYear?: string;
  taskMake?: string;
  leadMake?: string;
  taskModel?: string;
  leadModel?: string;
  taskLeadSource?: string;
  leadSource?: string;
  taskLeadSourceName?: string;
  leadSourceName?: string;
  taskLeadSourceGroup?: string;
  leadSourceGroup?: string;
};

function normalizeFeatureValue(value?: string): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function sameValue(a?: string, b?: string): boolean {
  const normalizedA = normalizeFeatureValue(a);
  const normalizedB = normalizeFeatureValue(b);

  if (!normalizedA || !normalizedB) {
    return false;
  }

  return normalizedA === normalizedB;
}

export function getMatchingFeatures(
  input: MatchFeatureInput,
): string[] {
  const matches: string[] = [];

  if (sameValue(input.taskYear, input.leadYear)) {
    matches.push("year");
  }

  if (sameValue(input.taskMake, input.leadMake)) {
    matches.push("make");
  }

  if (sameValue(input.taskModel, input.leadModel)) {
    matches.push("model");
  }

  if (sameValue(input.taskLeadSource, input.leadSource)) {
    matches.push("lead_source");
  }

  if (sameValue(input.taskLeadSourceName, input.leadSourceName)) {
    matches.push("lead_source_name");
  }

  if (sameValue(input.taskLeadSourceGroup, input.leadSourceGroup)) {
    matches.push("lead_source_group");
  }

  return matches;
}