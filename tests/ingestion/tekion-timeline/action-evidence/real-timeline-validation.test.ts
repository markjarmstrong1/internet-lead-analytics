import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { summarizeActionEvidence } from "../../../../src/integrations/tekion/timeline/action-evidence/summarize-action-evidence";
import { getTekionTimelinePath } from "@/lib/tekion/fixture-paths";

const FILES = [
  "ana_yu.txt",
  "anthony_bacon.txt",
  "jeffery_becker.txt",
  "jim_wilson.txt",
];

describe("real Tekion timeline action evidence", () => {
  it("processes all real timeline samples and reports aggregate evidence only", () => {
    const summaries = FILES.map((fileName) => {
      const content = readFileSync(getTekionTimelinePath(fileName), "utf8");

      return summarizeActionEvidence(content, fileName);
    });

    const totals = summaries.reduce(
      (total, summary) => ({
        totalEvents: total.totalEvents + summary.totalEvents,
        qualifyingEmployeeActions:
          total.qualifyingEmployeeActions +
          summary.qualifyingEmployeeActions,
        email: total.email + summary.byChannel.email,
        text: total.text + summary.byChannel.text,
        phone: total.phone + summary.byChannel.phone,
        voicemail: total.voicemail + summary.byChannel.voicemail,
        inboundCommunication:
          total.inboundCommunication + summary.inboundCommunication,
        workflowEvents: total.workflowEvents + summary.workflowEvents,
        automationEvents: total.automationEvents + summary.automationEvents,
        otherEvents: total.otherEvents + summary.otherEvents,
      }),
      {
        totalEvents: 0,
        qualifyingEmployeeActions: 0,
        email: 0,
        text: 0,
        phone: 0,
        voicemail: 0,
        inboundCommunication: 0,
        workflowEvents: 0,
        automationEvents: 0,
        otherEvents: 0,
      },
    );

    for (const summary of summaries) {
      const accountedFor =
        summary.qualifyingEmployeeActions +
        summary.inboundCommunication +
        summary.workflowEvents +
        summary.automationEvents +
        summary.otherEvents;

      expect(accountedFor).toBe(summary.totalEvents);
    }

    expect(summaries).toHaveLength(4);
    expect(totals.totalEvents).toBeGreaterThan(0);

    console.log("\nTekion Action Evidence — aggregate validation");
    console.log("============================================");
    console.log(`Timeline files: ${summaries.length}`);
    console.log(`Total events: ${totals.totalEvents}`);
    console.log(
      `Qualifying employee action evidence: ${totals.qualifyingEmployeeActions}`,
    );
    console.log(`  Email: ${totals.email}`);
    console.log(`  Text: ${totals.text}`);
    console.log(`  Phone: ${totals.phone}`);
    console.log(`  Voicemail: ${totals.voicemail}`);
    console.log(`Inbound communication: ${totals.inboundCommunication}`);
    console.log(`Workflow/task events: ${totals.workflowEvents}`);
    console.log(`Automation/system events: ${totals.automationEvents}`);
    console.log(`Other events: ${totals.otherEvents}`);
    console.log("============================================\n");
  });
});
