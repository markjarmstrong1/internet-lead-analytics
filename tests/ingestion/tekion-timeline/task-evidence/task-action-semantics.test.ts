import { describe, expect, it } from "vitest";
import { parseTaskAction } from "../../../../src/integrations/tekion/csv/task-action-semantics";

describe("parseTaskAction", () => {
  it("maps single Task channels", () => {
    expect(parseTaskAction("Call").channels).toEqual([
      "phone",
    ]);

    expect(parseTaskAction("Mail").channels).toEqual([
      "email",
    ]);

    expect(parseTaskAction("Text").channels).toEqual([
      "text",
    ]);
  });

  it("treats channel ordering as semantically irrelevant", () => {
    const first = parseTaskAction(
      "Call,Mail,Text",
    );

    const second = parseTaskAction(
      "Text,Call,Mail",
    );

    expect(first.channels).toEqual(second.channels);
  });

  it("deduplicates repeated channels", () => {
    expect(
      parseTaskAction("Call,Call,Text").channels,
    ).toEqual(["text", "phone"]);
  });

  it("preserves unknown action tokens", () => {
    expect(
      parseTaskAction("Call,Email,SOMETHING").unknownTokens,
    ).toEqual(["Email", "SOMETHING"]);

    expect(
      parseTaskAction("Call,Email,SOMETHING").channels,
    ).toEqual(["phone"]);
  });

  it("does not confuse Task title wording with Action semantics", () => {
    expect(parseTaskAction("Mail").channels).toEqual([
      "email",
    ]);

    expect(parseTaskAction("Call,Mail").channels).toEqual([
      "email",
      "phone",
    ]);
  });
});
