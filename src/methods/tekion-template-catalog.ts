import "server-only";

import fs from "node:fs";
import path from "node:path";

import {
  normalize,
  stripTekionDynamicTags,
} from "./template-matching";

export type CatalogTemplate = {
  name: string;
  description: string;
  sourcePath: string;
  sourceKind: "email" | "text";
  externalTemplateKey: string;
  subject: string | null;
  content: string;
  normalizedContent: string;
  normalizedSubject: string | null;
  metadata: Record<string, unknown>;
};

const ROOT = path.join(
  process.cwd(),
  "data",
  "tekion",
);

function readJson(filePath: string): Record<string, unknown> {
  return JSON.parse(
    fs.readFileSync(filePath, "utf8"),
  ) as Record<string, unknown>;
}

function extractComponentHtml(
  value: unknown,
): string[] {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) &&
          typeof item === "object",
      )
      .filter((item) => {
        const key = item.key;
        return (
          key === "TEXT_TEMPLATE" ||
          key === "SUBJECT_TEMPLATE"
        );
      })
      .map((item) => {
        const props = item.componentProps;

        if (
          !props ||
          typeof props !== "object"
        ) {
          return "";
        }

        const html =
          (props as Record<string, unknown>).html;

        return typeof html === "string" ? html : "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

function buildTemplateFromFile(
  filePath: string,
  sourceKind: "email" | "text",
): CatalogTemplate {
  const relative = path
    .relative(process.cwd(), filePath)
    .replaceAll("\\", "/");

  const parsed = readJson(filePath);

  const bodyHtml = extractComponentHtml(
    parsed.body,
  );

  const subjectHtml =
    sourceKind === "email"
      ? extractComponentHtml(parsed.subject).join(" ")
      : "";

  const subject = subjectHtml
    ? stripTekionDynamicTags(subjectHtml).literal
    : null;

  const content = bodyHtml
    .map((html) => stripTekionDynamicTags(html).literal)
    .filter(Boolean)
    .join("\n");

  const name =
    sourceKind === "text"
      ? path.basename(filePath, ".json")
      : path.basename(path.dirname(filePath));

  return {
    name,
    description:
      sourceKind === "email"
        ? "Tekion email template"
        : "Tekion text template",
    sourcePath: relative,
    sourceKind,
    externalTemplateKey: relative,
    subject,
    content,
    normalizedContent: normalize(content),
    normalizedSubject: subject
      ? normalize(subject)
      : null,
    metadata: {
      sourcePath: relative,
      sourceKind,
    },
  };
}

function walk(
  directory: string,
): string[] {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const entries = fs.readdirSync(
    directory,
    { withFileTypes: true },
  );

  return entries.flatMap((entry) => {
    const fullPath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return entry.name === "template.json"
      ? [fullPath]
      : sourceKindForFile(fullPath)
        ? [fullPath]
        : [];
  });
}

function sourceKindForFile(
  filePath: string,
): "email" | "text" | null {
  const relative = path
    .relative(ROOT, filePath)
    .replaceAll("\\", "/");

  if (
    relative.startsWith("email-templates/") &&
    path.basename(filePath) === "template.json"
  ) {
    return "email";
  }

  if (
    relative.startsWith("text-templates/") &&
    relative.endsWith(".json")
  ) {
    return "text";
  }

  return null;
}

export function loadTekionTemplateCatalog(): CatalogTemplate[] {
  return walk(ROOT)
    .map((filePath) => {
      const kind = sourceKindForFile(filePath);

      if (!kind) {
        return null;
      }

      return buildTemplateFromFile(
        filePath,
        kind,
      );
    })
    .filter(
      (template): template is CatalogTemplate =>
        template !== null,
    )
    .sort((a, b) =>
      a.sourcePath.localeCompare(b.sourcePath),
    );
}
