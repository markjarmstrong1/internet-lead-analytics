import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getTekionTimelinePath,
  tekionTimelineDirectory,
  tekionTimelineFiles,
} from "./fixture-paths";

describe("Tekion fixture paths", () => {
  it("keeps timeline fixtures under the timelines directory", () => {
    expect(tekionTimelineDirectory).toBe(
      path.join(process.cwd(), "data/tekion/timelines"),
    );
  });

  it("defines the known timeline fixture files", () => {
    expect(tekionTimelineFiles).toEqual([
      "ana_yu.txt",
      "anthony_bacon.txt",
      "jeffery_becker.txt",
      "jim_wilson.txt",
    ]);
  });

  it("builds timeline paths from the timelines directory", () => {
    expect(getTekionTimelinePath("ana_yu.txt")).toBe(
      path.join(
        process.cwd(),
        "data/tekion/timelines/ana_yu.txt",
      ),
    );
  });
});
