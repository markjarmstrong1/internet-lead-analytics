"use client";

import { useEffect, useState } from "react";

export type NavigationLayout = "sidebar" | "topbar";

const STORAGE_KEY = "ila-navigation-layout";
const CHANGE_EVENT = "ila-navigation-layout-change";

export function getNavigationLayout(): NavigationLayout {
  if (typeof window === "undefined") return "sidebar";

  return window.localStorage.getItem(STORAGE_KEY) === "topbar"
    ? "topbar"
    : "sidebar";
}

export function setNavigationLayout(layout: NavigationLayout) {
  window.localStorage.setItem(STORAGE_KEY, layout);
  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, { detail: layout }),
  );
}

export function useNavigationLayout() {
  const [layout, setLayout] = useState<NavigationLayout>("sidebar");

  useEffect(() => {
    setLayout(getNavigationLayout());

    function handleChange(event: Event) {
      const detail = (event as CustomEvent<NavigationLayout>).detail;

      if (detail === "sidebar" || detail === "topbar") {
        setLayout(detail);
      }
    }

    function handleStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY) {
        setLayout(getNavigationLayout());
      }
    }

    window.addEventListener(CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return layout;
}
