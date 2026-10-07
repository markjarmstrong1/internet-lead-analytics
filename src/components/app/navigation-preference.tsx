"use client";

import { useSyncExternalStore } from "react";

export type NavigationLayout = "sidebar" | "topbar";

const STORAGE_KEY = "ila-navigation-layout";
const CHANGE_EVENT = "ila-navigation-layout-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getNavigationLayout(): NavigationLayout {
  if (typeof window === "undefined") return "sidebar";

  return window.localStorage.getItem(STORAGE_KEY) === "topbar"
    ? "topbar"
    : "sidebar";
}

export function setNavigationLayout(layout: NavigationLayout) {
  window.localStorage.setItem(STORAGE_KEY, layout);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useNavigationLayout() {
  return useSyncExternalStore(
    subscribe,
    getNavigationLayout,
    () => "sidebar",
  );
}
