import type { ProgressionAnalysis, StageEntry, EvidenceCoverageStatus } from "./progression-types";
import type { ProgressionAssociation } from "./progression-report-types";

export type ProgressionDashboardLead = {
  leadId: string;
  source: string;
  sourceGroup: string;
  creationTime: string | null;
  timelineRecordIds: string[];
  entries: StageEntry[];
  evidenceCoverage: {
    status: EvidenceCoverageStatus;
    eventCount: number;
    timelineRecordCount: number;
    stagesWithEvidence: number;
    totalStages: number;
    unresolvedStages: ProgressionAnalysis["leads"][number]["evidenceCoverage"]["unresolvedStages"];
  };
  events: Array<{
    timelineRecordId: string;
    sourceEventId: string;
    sourceFile: string | null;
    occurredAt: string;
    rawType: string;
    actorType: string;
    category: string;
    channel: string | null;
    direction: string | null;
    details: string;
    templateCode?: string | null;
  }>;
};

export type ProgressionDashboardData = Omit<ProgressionAnalysis, "leads"> & {
  leads: ProgressionDashboardLead[];
};
