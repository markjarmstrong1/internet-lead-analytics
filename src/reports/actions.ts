"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  normalizeReportDefinition,
} from "./report-definition";
import { createServerReportRepository } from "./create-server-report-repository";

export async function saveReportAction(
  formData: FormData,
) {
  const definitionValue =
    formData.get("definition");

  if (typeof definitionValue !== "string") {
    throw new Error(
      "Report definition is required.",
    );
  }

  let definition: unknown;

  try {
    definition = JSON.parse(
      definitionValue,
    );
  } catch {
    throw new Error(
      "Report definition is invalid JSON.",
    );
  }

  const normalized =
    normalizeReportDefinition(
      definition,
    );

  const reportIdValue =
    formData.get("reportId");

  const reportId =
    typeof reportIdValue === "string" &&
    reportIdValue.trim()
      ? reportIdValue.trim()
      : null;

  const report =
    await createServerReportRepository().save(
      reportId,
      normalized,
    );

  revalidatePath("/reports");

  redirect(
    `/reports?reportId=${encodeURIComponent(
      report.id,
    )}`,
  );
}

export async function deleteReportAction(
  formData: FormData,
) {
  const reportIdValue =
    formData.get("reportId");

  if (
    typeof reportIdValue !== "string" ||
    !reportIdValue.trim()
  ) {
    throw new Error(
      "Report id is required.",
    );
  }

  await createServerReportRepository().delete(
    reportIdValue.trim(),
  );

  revalidatePath("/reports");

  redirect("/reports");
}
