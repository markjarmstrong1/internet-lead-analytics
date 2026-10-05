import { describe, expect, it } from "vitest";
import {
  matchCommunicationToTemplates,
  stripTekionDynamicTags,
  type TemplateCandidate,
} from "../template-matching";

function template(
  id: string,
  name: string,
  content: string,
): TemplateCandidate {
  return {
    templateId: id,
    templateName: name,
    sourceKind: "text",
    content,
    subject: null,
    normalizedContent: content,
    normalizedSubject: null,
  };
}

describe("template matching", () => {
  it("removes nested Tekion dynamic spans without leaving markup", () => {
    const result = stripTekionDynamicTags(
      [
        "Hello ",
        '<span class="dynamic_tag">',
        '<span class="value">John</span>',
        "</span>",
        ", welcome to Joyce Koons.",
      ].join(""),
    );

    expect(result.literal).toContain("Hello");
    expect(result.literal).toContain("welcome to Joyce Koons");
    expect(result.literal).not.toContain("<span");
    expect(result.literal).not.toContain("</span>");
  });

  it("matches a 0TXT-style template despite substituted dynamic values", () => {
    const result = matchCommunicationToTemplates(
      [
        "Hi John,",
        "Why drive to a dealership when we will drive to you?",
        "At Joyce Koons Honda Buick GMC, we bring a great deal",
        "and your 2025 Honda Civic straight to your driveway.",
      ].join(" "),
      null,
      [
        template(
          "t0",
          "0TXT Convenience",
          [
            "Hi {{customer_first_name}},",
            "Why drive to a dealership when we will drive to you?",
            "At Joyce Koons Honda Buick GMC, we bring a great deal",
            "and your {{vehicle_year}} {{vehicle_make}} {{vehicle_model}}",
            "straight to your driveway.",
          ].join(" "),
        ),
      ],
    );

    expect(result.status).toBe("matched");
    expect(result.templateId).toBe("t0");
    expect(result.evidence.matchedTokens).toBeGreaterThanOrEqual(10);
    expect(result.evidence.coverage).toBeGreaterThan(0.55);
  });

  it("keeps ambiguous partial matches in review", () => {
    const result = matchCommunicationToTemplates(
      "Thanks for reaching out about your vehicle. I would be happy to help.",
      null,
      [
        template(
          "a",
          "Template A",
          "Thanks for reaching out about your vehicle. I would be happy to help.",
        ),
        template(
          "b",
          "Template B",
          "Thanks for reaching out about your vehicle. I would be happy to help today.",
        ),
      ],
    );

    expect(result.status).toBe("review");
    expect(result.templateId).toBeNull();
    expect(result.evidence.candidateCount).toBe(2);
  });

  it("does not match a generic template from only a short shared phrase", () => {
    const result = matchCommunicationToTemplates(
      "Hi John, thanks for reaching out. I would be happy to help you.",
      null,
      [
        template(
          "generic",
          "Generic",
          "Hi, thanks for reaching out. I would be happy to help you today.",
        ),
      ],
    );

    expect(result.status).toBe("unmatched");
    expect(result.templateId).toBeNull();
  });
});
