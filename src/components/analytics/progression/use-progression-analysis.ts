"use client";

import { useEffect, useState } from "react";
import type { ProgressionAnalysis } from "@/analytics/progression/progression-types";

type State = { data: ProgressionAnalysis | null; loading: boolean; error: string | null };

export function useProgressionAnalysis(): State {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/analytics/progression", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Progression data could not be loaded.");
        return response.json() as Promise<ProgressionAnalysis>;
      })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ data: null, loading: false, error: error instanceof Error ? error.message : "Unexpected progression error." });
      });
    return () => controller.abort();
  }, []);
  return state;
}
