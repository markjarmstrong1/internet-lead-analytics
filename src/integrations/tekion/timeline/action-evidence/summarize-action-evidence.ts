import { classifyActionEvidence } from "./classify-action-evidence";
import { importTimelineFile } from "../import-timeline-file";
import type { TekionNormalizedTimelineEvent } from "../normalized-timeline-event";

export type TekionActionEvidenceSummary = {
  sourceFile: string;
  totalEvents: number;
  qualifyingEmployeeActions: number;
  byChannel: {
    email: number;
    text: number;
    phone: number;
    voicemail: number;
  };
  inboundCommunication: number;
  workflowEvents: number;
  automationEvents: number;
  otherEvents: number;
};

export function summarizeActionEvidence(
  content: string,
  sourceFile: string,
): TekionActionEvidenceSummary {
  const imported = importTimelineFile(content, sourceFile);

  const summary: TekionActionEvidenceSummary = {
    sourceFile,
    totalEvents: imported.events.length,
    qualifyingEmployeeActions: 0,
    byChannel: {
      email: 0,
      text: 0,
      phone: 0,
      voicemail: 0,
    },
    inboundCommunication: 0,
    workflowEvents: 0,
    automationEvents: 0,
    otherEvents: 0,
  };

  for (const event of imported.events) {
    const evidence = classifyActionEvidence(event);

    if (evidence.qualifiesAsEmployeeAction) {
      summary.qualifyingEmployeeActions += 1;

      if (evidence.channel) {
        summary.byChannel[evidence.channel] += 1;
      }

      continue;
    }

    if (evidence.reason === "inbound_customer_communication") {
      summary.inboundCommunication += 1;
      continue;
    }

    if (evidence.reason === "workflow_activity") {
      summary.workflowEvents += 1;
      continue;
    }

    if (evidence.reason === "automation_or_system_activity") {
      summary.automationEvents += 1;
      continue;
    }

    summary.otherEvents += 1;
  }

  return summary;
}

export function summarizeActionEvidenceForEvents(
  events: TekionNormalizedTimelineEvent[],
  sourceFile: string,
): TekionActionEvidenceSummary {
  const summary: TekionActionEvidenceSummary = {
    sourceFile,
    totalEvents: events.length,
    qualifyingEmployeeActions: 0,
    byChannel: {
      email: 0,
      text: 0,
      phone: 0,
      voicemail: 0,
    },
    inboundCommunication: 0,
    workflowEvents: 0,
    automationEvents: 0,
    otherEvents: 0,
  };

  for (const event of events) {
    const evidence = classifyActionEvidence(event);

    if (evidence.qualifiesAsEmployeeAction) {
      summary.qualifyingEmployeeActions += 1;

      if (evidence.channel) {
        summary.byChannel[evidence.channel] += 1;
      }

      continue;
    }

    if (evidence.reason === "inbound_customer_communication") {
      summary.inboundCommunication += 1;
      continue;
    }

    if (evidence.reason === "workflow_activity") {
      summary.workflowEvents += 1;
      continue;
    }

    if (evidence.reason === "automation_or_system_activity") {
      summary.automationEvents += 1;
      continue;
    }

    summary.otherEvents += 1;
  }

  return summary;
}
