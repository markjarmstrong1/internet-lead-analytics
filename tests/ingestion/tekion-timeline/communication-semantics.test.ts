import { describe, expect, it } from "vitest";
import { communicationSemanticsForType } from "../../../src/integrations/tekion/timeline/communication-semantics";

describe("communicationSemanticsForType", () => {
  it("maps sent email to outbound email", () => {
    expect(communicationSemanticsForType("Email Sent")).toEqual({
      channel: "email",
      direction: "outbound",
    });
  });

  it("maps received text to inbound text", () => {
    expect(communicationSemanticsForType("Text Received")).toEqual({
      channel: "text",
      direction: "inbound",
    });
  });

  it("maps outbound calls to outbound phone", () => {
    expect(communicationSemanticsForType("Outbound Call")).toEqual({
      channel: "phone",
      direction: "outbound",
    });
  });

  it("preserves uncertainty for missed calls", () => {
    expect(communicationSemanticsForType("Missed Call")).toEqual({
      channel: "phone",
      direction: "unknown",
    });
  });

  it("does not classify tasks as communications", () => {
    expect(
      communicationSemanticsForType("Day 5 Internet Lead Tasking - Touch"),
    ).toBeUndefined();
  });
});
