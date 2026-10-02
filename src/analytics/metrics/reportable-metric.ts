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
  exposureSourceFile: string | null;
  exposureRawType: string;
  exposureActor: string;
  exposureDetails: string;
  exposureAt: string;

  outcomeEventId: string | null;
  outcomeSourceFile: string | null;
  outcomeRawType: string | null;
  outcomeActor: string | null;
  outcomeDetails: string | null;
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
