import { describe, expect, it } from "vitest";
import {
  TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-metric-definitions";

describe("task workflow report metric definitions", () => {
  it("defines the expected reporting metrics", () => {
    expect(
      TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS.map(
        (metric) => metric.key,
      ),
    ).toEqual([
      "identity_evidence_coverage",
      "direct_identity_rate",
      "unresolved_identity_rate",
      "qualifying_outbound_evidence_rate",
      "outbound_channel_mismatch_rate",
      "inbound_only_rate",
      "no_communication_evidence_rate",
      "allowed_channel_event_share",
      "mismatched_channel_event_share",
    ]);
  });

  it("defines numerator and denominator semantics for every metric", () => {
    for (const metric of TASK_WORKFLOW_REPORT_METRIC_DEFINITIONS) {
      expect(metric.numeratorDefinition.length).toBeGreaterThan(0);
      expect(metric.denominatorDefinition.length).toBeGreaterThan(0);
    }
  });
});
