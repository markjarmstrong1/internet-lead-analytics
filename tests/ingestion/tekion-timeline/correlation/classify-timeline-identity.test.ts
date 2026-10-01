import { describe, expect, it } from "vitest";
import { classifyTimelineIdentity } from "../../../../src/integrations/tekion/timeline/correlation/classify-timeline-identity";

describe("classifyTimelineIdentity", () => {
  it("classifies a direct identity match", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Ana Yu",
      candidateIdentity: "Ana Yu",
    });

    expect(result).toEqual({
      status: "direct_match",
      similarity: 1,
    });
  });

  it("ignores case and punctuation for direct identity matching", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Ana_Yu",
      candidateIdentity: "ana yu",
    });

    expect(result).toEqual({
      status: "direct_match",
      similarity: 1,
    });
  });

  it("does not promote a fuzzy match to identity", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Jeffery Becker",
      candidateIdentity: "Jeffrey Becker",
    });

    expect(result.status).toBe("unresolved_variant");
    expect(result.similarity).toBeGreaterThan(0.85);
    expect(result.similarity).toBeLessThan(1);
  });

  it("does not treat a one-token overlap as an identity variant", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Jeffery Becker",
      candidateIdentity: "Becker",
    });

    expect(result.status).toBe("no_match");
    expect(result.similarity).toBeLessThan(1);
  });

  it("classifies unrelated identities as no match", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Ana Yu",
      candidateIdentity: "Jim Wilson",
    });

    expect(result).toEqual({
      status: "no_match",
      similarity: expect.any(Number),
    });

    expect(result.similarity).toBeLessThan(0.85);
  });

  it("does not require token order to match", () => {
    const result = classifyTimelineIdentity({
      timelineIdentity: "Ana Yu",
      candidateIdentity: "Yu Ana",
    });

    expect(result).toEqual({
      status: "direct_match",
      similarity: 1,
    });
  });
});
