export type MetricEvidenceLevel = "observed" | "inferred" | "calculated";

export type MetricDefinition = {
  id: string;
  label: string;
  description: string;
  numeratorLabel: string;
  denominatorLabel: string;
  populationDefinition: string;
  calculationDefinition: string;
  evidenceLevel: MetricEvidenceLevel;
  limitations: string[];
};

const definitions: Record<string, MetricDefinition> = {
  "response-rate": {
    id: "response-rate",
    label: "Observed response rate",
    description:
      "The share of leads with observed inbound response evidence among leads with observed employee outbound communication evidence.",
    numeratorLabel: "Leads with observed inbound response evidence",
    denominatorLabel: "Leads with observed employee outbound communication evidence",
    populationDefinition:
      "Canonical leads evaluated by the existing analytics observation model. Leads without qualifying outbound evidence are not in the denominator.",
    calculationDefinition:
      "Leads with observed response evidence divided by leads with observed outbound evidence. The existing observation rules determine qualifying events.",
    evidenceLevel: "calculated",
    limitations: [
      "This is an observational association, not evidence that outbound communication caused a response.",
      "A missing timeline or missing event is not proof that an action did not occur.",
      "The denominator is leads with observed outbound evidence, not all leads or all outbound events.",
      "The response window and event classification follow the existing observation model.",
    ],
  },
};

export function getMetricDefinition(id: string): MetricDefinition | null {
  return definitions[id] ?? null;
}

export function listMetricDefinitions(): MetricDefinition[] {
  return Object.values(definitions);
}
