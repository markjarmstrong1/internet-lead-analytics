import {
  describe,
  expect,
  it,
} from "vitest";

import {
  presentTaskWorkflowReportMetric,
} from "../../../../../src/integrations/tekion/timeline/task-evidence/reporting/task-workflow-report-presentation";

describe(
  "presentTaskWorkflowReportMetric",
  () => {
    it("adds definition text and formats the rate", () => {
      const result =
        presentTaskWorkflowReportMetric({
          key: "direct_identity_rate",
          numerator: 3,
          denominator: 10,
          rate: 0.3,
        });

      expect(result.label).toBe(
        "Direct identity rate",
      );
      expect(result.displayValue).toBe(
        "30.0%",
      );
      expect(result.numerator).toBe(3);
      expect(result.denominator).toBe(10);
    });

    it("uses an em dash for an undefined rate", () => {
      const result =
        presentTaskWorkflowReportMetric({
          key: "direct_identity_rate",
          numerator: 0,
          denominator: 0,
          rate: undefined,
        });

      expect(result.displayValue).toBe("—");
    });
  },
);
