import { describe, expect, it } from "vitest";
import {
  matchTaskToLead,
} from "../../src/integrations/tekion/matching/match-task-to-lead";
import {
  selectLeadMatch,
  type LeadCandidate,
} from "../../src/integrations/tekion/matching/select-lead-match";

describe("matchTaskToLead", () => {
  it("matches when name and vehicle features match", () => {
    const result = matchTaskToLead({
      taskName: "John Michael Smith",
      leadName: "John Smith",
      taskYear: "2026",
      leadYear: "2026",
      taskMake: "Honda",
      leadMake: "Honda",
      taskModel: "CR-V",
      leadModel: "CR-V",
    });

    expect(result).toEqual({
      status: "matched",
      features: ["year", "make", "model"],
    });
  });

  it("allows a middle name on the task", () => {
    const result = matchTaskToLead({
      taskName: "John Michael Smith",
      leadName: "John Smith",
      taskYear: "2026",
      leadYear: "2026",
    });

    expect(result).toEqual({
      status: "matched",
      features: ["year"],
    });
  });

  it("does not match on vehicle data without a name match", () => {
    const result = matchTaskToLead({
      taskName: "Someone Else",
      leadName: "John Smith",
      taskYear: "2026",
      leadYear: "2026",
      taskMake: "Honda",
      leadMake: "Honda",
    });

    expect(result).toEqual({
      status: "unmatched",
      features: [],
    });
  });

  it("does not match on name alone", () => {
    const result = matchTaskToLead({
      taskName: "John Smith",
      leadName: "John Smith",
    });

    expect(result).toEqual({
      status: "unmatched",
      features: [],
    });
  });

  it("normalizes vehicle formatting", () => {
    const result = matchTaskToLead({
      taskName: "John Smith",
      leadName: "John Smith",
      taskModel: "CR-V",
      leadModel: "cr v",
    });

    expect(result).toEqual({
      status: "matched",
      features: ["model"],
    });
  });

  it("matches using a source feature", () => {
    const result = matchTaskToLead({
      taskName: "John Smith",
      leadName: "John Smith",
      taskLeadSourceName: "ThirdParty Honda",
      leadSourceName: "thirdparty honda",
    });

    expect(result).toEqual({
      status: "matched",
      features: ["lead_source_name"],
    });
  });
});

describe("selectLeadMatch", () => {
  const task = {
    taskName: "John Michael Smith",
    taskYear: "2026",
    taskMake: "Honda",
    taskModel: "CR-V",
    taskLeadSource: "OEM",
  };

    const leadOne: LeadCandidate = {
    leadId: "lead-1",
    leadName: "John Smith",
    leadYear: "2026",
    leadMake: "Honda",
    leadModel: "CR-V",
    leadSource: "OEM",
    };

  const leadTwo: LeadCandidate = {
    leadId: "lead-2",
    leadName: "Michael Jones",
    leadYear: "2026",
    leadMake: "Honda",
    leadModel: "CR-V",
    leadSource: "OEM",
    taskName: "",
  };

  it("selects the unique matching lead", () => {
    const result = selectLeadMatch(task, [
      leadOne,
      leadTwo,
    ]);

    expect(result.status).toBe("matched");
    expect(result.leadId).toBe("lead-1");
    expect(result.features).toEqual([
      "year",
      "make",
      "model",
      "lead_source",
    ]);
    expect(result.candidates).toEqual([
      {
        leadId: "lead-1",
        features: [
          "year",
          "make",
          "model",
          "lead_source",
        ],
      },
    ]);
  });

  it("marks multiple valid candidates as ambiguous", () => {
    const duplicateLead: LeadCandidate = {
      ...leadOne,
      leadId: "lead-3",
    };

    const result = selectLeadMatch(task, [
      leadOne,
      duplicateLead,
    ]);

    expect(result.status).toBe("ambiguous");
    expect(result.leadId).toBeUndefined();
    expect(result.features).toEqual([]);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates.map((candidate) => candidate.leadId))
      .toEqual(["lead-1", "lead-3"]);
  });

  it("marks the task unmatched when nothing satisfies the rule", () => {
    const result = selectLeadMatch(
      task,
      [
        {
          ...leadOne,
          leadName: "Nobody Here",
        },
      ],
    );

    expect(result).toEqual({
      status: "unmatched",
      features: [],
      candidates: [],
    });
  });

  it("does not guess when the names match but no feature matches", () => {
    const result = selectLeadMatch(
      {
        taskName: "John Smith",
        taskYear: "2027",
        taskMake: "Toyota",
      },
      [
        {
          ...leadOne,
          leadYear: "2026",
          leadMake: "Honda",
          leadModel: "CR-V",
          leadSource: "OEM",
        },
      ],
    );

    expect(result).toEqual({
      status: "unmatched",
      features: [],
      candidates: [],
    });
  });
});