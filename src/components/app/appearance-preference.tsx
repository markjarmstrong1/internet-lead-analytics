"use client";

import { useSyncExternalStore } from "react";

export type AppearanceTheme =
  | "professional"
  | "tech"
  | "executive"
  | "performance";

export type AppearanceAccent =
  | "gold"
  | "blue"
  | "cyan"
  | "violet"
  | "red";

export type AppearanceDensity =
  | "comfortable"
  | "standard"
  | "dense";

export type AppearanceRadius =
  | "sharp"
  | "standard"
  | "rounded";

export type AppearanceMotion =
  | "full"
  | "reduced"
  | "minimal";

export type AppearanceChart =
  | "standard"
  | "technical"
  | "minimal";

export type AppearancePreferences = {
  theme: AppearanceTheme;
  accent: AppearanceAccent;
  density: AppearanceDensity;
  radius: AppearanceRadius;
  motion: AppearanceMotion;
  chart: AppearanceChart;
};

export const DEFAULT_APPEARANCE: AppearancePreferences = {
  theme: "professional",
  accent: "gold",
  density: "standard",
  radius: "standard",
  motion: "full",
  chart: "standard",
};

const STORAGE_KEY = "ila-appearance";
const CHANGE_EVENT = "ila-appearance-change";

let cachedPreferences = DEFAULT_APPEARANCE;
let cachedStorageValue: string | null | undefined;

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function isTheme(value: unknown): value is AppearanceTheme {
  return (
    value === "professional" ||
    value === "tech" ||
    value === "executive" ||
    value === "performance"
  );
}

function isAccent(value: unknown): value is AppearanceAccent {
  return (
    value === "gold" ||
    value === "blue" ||
    value === "cyan" ||
    value === "violet" ||
    value === "red"
  );
}

function isDensity(value: unknown): value is AppearanceDensity {
  return (
    value === "comfortable" ||
    value === "standard" ||
    value === "dense"
  );
}

function isRadius(value: unknown): value is AppearanceRadius {
  return (
    value === "sharp" ||
    value === "standard" ||
    value === "rounded"
  );
}

function isMotion(value: unknown): value is AppearanceMotion {
  return (
    value === "full" ||
    value === "reduced" ||
    value === "minimal"
  );
}

function isChart(value: unknown): value is AppearanceChart {
  return (
    value === "standard" ||
    value === "technical" ||
    value === "minimal"
  );
}

function normalizePreferences(value: unknown): AppearancePreferences {
  if (!value || typeof value !== "object") {
    return DEFAULT_APPEARANCE;
  }

  const input = value as Record<string, unknown>;

  return {
    theme: isTheme(input.theme)
      ? input.theme
      : DEFAULT_APPEARANCE.theme,
    accent: isAccent(input.accent)
      ? input.accent
      : DEFAULT_APPEARANCE.accent,
    density: isDensity(input.density)
      ? input.density
      : DEFAULT_APPEARANCE.density,
    radius: isRadius(input.radius)
      ? input.radius
      : DEFAULT_APPEARANCE.radius,
    motion: isMotion(input.motion)
      ? input.motion
      : DEFAULT_APPEARANCE.motion,
    chart: isChart(input.chart)
      ? input.chart
      : DEFAULT_APPEARANCE.chart,
  };
}

function readPreferences(): AppearancePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (stored === cachedStorageValue) {
    return cachedPreferences;
  }

  cachedStorageValue = stored;

  if (!stored) {
    cachedPreferences = DEFAULT_APPEARANCE;
    return cachedPreferences;
  }

  try {
    cachedPreferences = normalizePreferences(JSON.parse(stored));
  } catch {
    cachedPreferences = DEFAULT_APPEARANCE;
  }

  return cachedPreferences;
}

export function setAppearancePreferences(
  preferences: AppearancePreferences,
) {
  const serialized = JSON.stringify(preferences);

  cachedPreferences = preferences;
  cachedStorageValue = serialized;

  window.localStorage.setItem(STORAGE_KEY, serialized);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetAppearancePreferences() {
  cachedPreferences = DEFAULT_APPEARANCE;
  cachedStorageValue = null;

  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAppearancePreferences() {
  return useSyncExternalStore(
    subscribe,
    readPreferences,
    () => DEFAULT_APPEARANCE,
  );
}
