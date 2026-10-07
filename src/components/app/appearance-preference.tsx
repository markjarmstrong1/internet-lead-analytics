\
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

function readPreferences(): AppearancePreferences {
  if (typeof window === "undefined") {
    return DEFAULT_APPEARANCE;
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) ?? "null",
    ) as Partial<AppearancePreferences> | null;

    return {
      ...DEFAULT_APPEARANCE,
      ...(stored ?? {}),
    };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getAppearancePreferences() {
  return readPreferences();
}

export function setAppearancePreferences(
  patch: Partial<AppearancePreferences>,
) {
  const next = {
    ...readPreferences(),
    ...patch,
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function resetAppearancePreferences() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(DEFAULT_APPEARANCE),
  );
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAppearancePreferences() {
  return useSyncExternalStore(
    subscribe,
    readPreferences,
    () => DEFAULT_APPEARANCE,
  );
}
