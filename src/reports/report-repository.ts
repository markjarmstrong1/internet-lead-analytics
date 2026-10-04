import type { SupabaseClient } from "@supabase/supabase-js";

import {
  normalizeReportDefinition,
} from "./report-definition";
import type {
  ReportDefinition,
  SavedReport,
} from "./report-types";

type ReportDefinitionRow = {
  id: string;
  name: string;
  definition: unknown;
  created_at: string;
  updated_at: string;
};

export interface ReportRepository {
  list(): Promise<SavedReport[]>;
  findById(id: string): Promise<SavedReport | null>;
  save(
    id: string | null,
    definition: ReportDefinition,
  ): Promise<SavedReport>;
  delete(id: string): Promise<void>;
}

export class SupabaseReportRepository
  implements ReportRepository
{
  constructor(
    private readonly client: SupabaseClient,
  ) {}

  async list(): Promise<SavedReport[]> {
    const { data, error } =
      await this.client
        .from("report_definitions")
        .select(
          "id, name, definition, created_at, updated_at",
        )
        .order("updated_at", {
          ascending: false,
        });

    if (error) {
      throw new Error(
        `Failed to load saved reports: ${error.message}`,
      );
    }

    return (
      (data as ReportDefinitionRow[] | null) ??
      []
    ).map(toSavedReport);
  }

  async findById(
    id: string,
  ): Promise<SavedReport | null> {
    const { data, error } =
      await this.client
        .from("report_definitions")
        .select(
          "id, name, definition, created_at, updated_at",
        )
        .eq("id", id)
        .maybeSingle();

    if (error) {
      throw new Error(
        `Failed to load report: ${error.message}`,
      );
    }

    return data
      ? toSavedReport(
          data as ReportDefinitionRow,
        )
      : null;
  }

  async save(
    id: string | null,
    definition: ReportDefinition,
  ): Promise<SavedReport> {
    const payload = {
      name: definition.name,
      definition,
      updated_at: new Date().toISOString(),
    };

    const query = id
      ? this.client
          .from("report_definitions")
          .update(payload)
          .eq("id", id)
          .select(
            "id, name, definition, created_at, updated_at",
          )
          .single()
      : this.client
          .from("report_definitions")
          .insert(payload)
          .select(
            "id, name, definition, created_at, updated_at",
          )
          .single();

    const { data, error } = await query;

    if (error) {
      throw new Error(
        `Failed to save report: ${error.message}`,
      );
    }

    return toSavedReport(
      data as ReportDefinitionRow,
    );
  }

  async delete(id: string): Promise<void> {
    const { error } =
      await this.client
        .from("report_definitions")
        .delete()
        .eq("id", id);

    if (error) {
      throw new Error(
        `Failed to delete report: ${error.message}`,
      );
    }
  }
}

function toSavedReport(
  row: ReportDefinitionRow,
): SavedReport {
  return {
    id: row.id,
    name: row.name,
    definition: normalizeReportDefinition(
      row.definition,
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
