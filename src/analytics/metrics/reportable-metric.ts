export type ReportableMetricClassification =
  | "descriptive"
  | "associational"
  | "causal";

export type ReportableMetricBreakdown = {
  key: string;
  label: string;
  denominator: number;
  numerator: number;
  rate: number | null;
};

export type ReportableMetricEvidence = {
  timelineRecordId: string;
  exposureEventId: string;
  outcomeEventId: string | null;
  exposureAt: string;
  outcomeAt: string | null;
};

export type ReportableMetric = {
  id: string;
  title: string;
  classification: ReportableMetricClassification;
  denominator: number;
  numerator: number;
  rate: number | null;
  windowHours: number;
  breakdowns: ReportableMetricBreakdown[];
  evidence: ReportableMetricEvidence[];
  limitations: string[];
};
