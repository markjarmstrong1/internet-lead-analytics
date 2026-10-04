import { describe, expect, it } from "vitest";

import {
  getTekionTimelinePath,
  hasLegacyTekionTimelineFixtures,
  legacyTekionTimelineFiles,
} from "./fixture-paths";

describe("Tekion fixture paths", () => {
  it("defines the legacy historical fixture set explicitly", () => {
    expect(legacyTekionTimelineFiles).toEqual([
      "ana_yu.txt",
      "anthony_bacon.txt",
      "jeffery_becker.txt",
      "jim_wilson.txt",
    ]);

    expect(
      legacyTekionTimelineFiles.every((file) =>
        getTekionTimelinePath(file).endsWith(
          `data/tekion/timelines/${file}`,
        ),
      ),
    ).toBe(true);
  });

  it("reports whether the legacy historical fixture pack is available", () => {
    expect(typeof hasLegacyTekionTimelineFixtures()).toBe(
      "boolean",
    );
  });
});
