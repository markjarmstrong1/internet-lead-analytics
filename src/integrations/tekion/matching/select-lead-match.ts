import {
  matchTaskToLead,
  type MatchFeatureInput,
} from "./match-task-to-lead";

export type LeadCandidate = {
  leadId: string;
  leadName: string;
  leadYear?: string;
  leadMake?: string;
  leadModel?: string;
  leadSource?: string;
  leadSourceName?: string;
  leadSourceGroup?: string;
};

export type TaskMatchInput = {
  taskName: string;
  taskYear?: string;
  taskMake?: string;
  taskModel?: string;
  taskLeadSource?: string;
  taskLeadSourceName?: string;
  taskLeadSourceGroup?: string;
};

export type LeadMatchCandidate = {
  leadId: string;
  features: string[];
};

export type LeadSelectionResult = {
  status: "matched" | "ambiguous" | "unmatched";
  leadId?: string;
  features: string[];
  candidates: LeadMatchCandidate[];
};

export function selectLeadMatch(
  task: TaskMatchInput,
  candidates: LeadCandidate[],
): LeadSelectionResult {
  const matches = candidates
    .map((candidate) => {
      const input: MatchFeatureInput = {
        taskYear: task.taskYear,
        leadYear: candidate.leadYear,
        taskMake: task.taskMake,
        leadMake: candidate.leadMake,
        taskModel: task.taskModel,
        leadModel: candidate.leadModel,
        taskLeadSource: task.taskLeadSource,
        leadSource: candidate.leadSource,
        taskLeadSourceName: task.taskLeadSourceName,
        leadSourceName: candidate.leadSourceName,
        taskLeadSourceGroup: task.taskLeadSourceGroup,
        leadSourceGroup: candidate.leadSourceGroup,
      };

      const result = matchTaskToLead({
        taskName: task.taskName,
        leadName: candidate.leadName,
        ...input,
      });

      return {
        leadId: candidate.leadId,
        result,
      };
    })
    .filter((match) => match.result.status === "matched")
    .map((match) => ({
      leadId: match.leadId,
      features: match.result.features,
    }));

  if (matches.length === 0) {
    return {
      status: "unmatched",
      features: [],
      candidates: [],
    };
  }

  if (matches.length > 1) {
    return {
      status: "ambiguous",
      features: [],
      candidates: matches,
    };
  }

  return {
    status: "matched",
    leadId: matches[0].leadId,
    features: matches[0].features,
    candidates: matches,
  };
}