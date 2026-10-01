import { describe, expect, it } from "vitest";
import { actorTypeForTimelineEvent } from "../../../src/integrations/tekion/timeline/actor-semantics";

describe("actorTypeForTimelineEvent", () => {
  it("classifies System as system", () => {
    expect(actorTypeForTimelineEvent("System")).toBe("system");
  });

  it("classifies Conversica actors as automation", () => {
    expect(actorTypeForTimelineEvent("Conversica")).toBe("automation");
  });

  it("classifies normal named actors as employees", () => {
    expect(actorTypeForTimelineEvent("Salesperson")).toBe("employee");
  });

  it("preserves uncertainty for an empty actor", () => {
    expect(actorTypeForTimelineEvent("")).toBe("unknown");
  });
});
