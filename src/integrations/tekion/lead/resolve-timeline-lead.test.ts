import { describe, expect, it } from "vitest";
import {
  resolveTimelineLead,
  type TimelineLeadIdentity,
} from "./resolve-timeline-lead";

function lead(
  externalRecordId: string,
  contactName: string,
): TimelineLeadIdentity {
  return {
    externalRecordId,
    contactName,
  };
}

describe("resolveTimelineLead", () => {
  it("matches an exact filename to a lead", () => {
    expect(
      resolveTimelineLead(
        "timelines/Ashley_Ward.docx",
        [
          lead("lead-1", "Ashley Ward"),
        ],
      ),
    ).toEqual({
      externalRecordId: "lead-1",
      status: "matched",
    });
  });
it("matches an explicit source filename alias", () => {
  expect(
    resolveTimelineLead(
      "timelines/jeffery_becker.txt",
      [
        lead(
          "6aacb48d7e39321adc5ede87",
          "Jeffrey Richard Becker",
        ),
      ],
    ),
  ).toEqual({
    externalRecordId: "6aacb48d7e39321adc5ede87",
    status: "matched",
  });
});

it("applies an alias consistently regardless of source path", () => {
  expect(
    resolveTimelineLead(
      "jeffery_becker.txt",
      [
        lead(
          "6aacb48d7e39321adc5ede87",
          "Jeffrey Richard Becker",
        ),
      ],
    ),
  ).toEqual({
    externalRecordId: "6aacb48d7e39321adc5ede87",
    status: "matched",
  });
});

it("does not apply an alias when the canonical lead is absent", () => {
  expect(
    resolveTimelineLead(
      "timelines/jeffery_becker.txt",
      [
        lead("lead-1", "Ashley Ward"),
      ],
    ),
  ).toEqual({
    externalRecordId: null,
    status: "unresolved",
  });
});

  it("matches when the canonical lead contains an additional middle name", () => {
    expect(
      resolveTimelineLead(
        "timelines/William_Glasgow.docx",
        [
          lead(
            "lead-1",
            "William NEWTON Glasgow",
          ),
        ],
      ),
    ).toEqual({
      externalRecordId: "lead-1",
      status: "matched",
    });
  });

  it("normalizes underscores, case, and accents", () => {
    expect(
      resolveTimelineLead(
        "timelines/Jose_Munoz.txt",
        [
          lead("lead-1", "José Muñoz"),
        ],
      ),
    ).toEqual({
      externalRecordId: "lead-1",
      status: "matched",
    });
  });

  it("returns ambiguous when multiple leads match", () => {
    expect(
      resolveTimelineLead(
        "timelines/John_Smith.docx",
        [
          lead("lead-1", "John Smith"),
          lead("lead-2", "John Smith"),
        ],
      ),
    ).toEqual({
      externalRecordId: null,
      status: "ambiguous",
    });
  });

  it("returns unresolved when no lead matches", () => {
    expect(
      resolveTimelineLead(
        "timelines/Unknown_Person.docx",
        [
          lead("lead-1", "Ashley Ward"),
        ],
      ),
    ).toEqual({
      externalRecordId: null,
      status: "unresolved",
    });
  });

  it("returns unresolved for a missing filename", () => {
    expect(
      resolveTimelineLead(
        null,
        [
          lead("lead-1", "Ashley Ward"),
        ],
      ),
    ).toEqual({
      externalRecordId: null,
      status: "unresolved",
    });
  });
});