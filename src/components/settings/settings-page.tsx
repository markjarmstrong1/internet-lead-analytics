"use client";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import {
  setNavigationLayout,
  useNavigationLayout,
  type NavigationLayout,
} from "@/components/app/navigation-preference";

const settings = [
  "General",
  "User preferences",
  "Dashboard preferences",
  "Default filters",
  "Report preferences",
  "Display",
  "Data preferences",
];

export function SettingsPage() {
  const navigationLayout = useNavigationLayout();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Application configuration and user preferences."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SectionPanel title="Settings">
          <nav className="space-y-1">
            {settings.map((setting) => (
              <button
                key={setting}
                type="button"
                className={[
                  "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  setting === "Display"
                    ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-strong)]"
                    : "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                {setting}
              </button>
            ))}
          </nav>
        </SectionPanel>

        <SectionPanel
          title="Display"
          description="Control how the application navigation is presented."
        >
          <div className="max-w-2xl space-y-6">
            <div>
              <h3 className="text-sm font-semibold">
                Navigation layout
              </h3>
              <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                Choose between a persistent sidebar or a traditional
                top navigation bar.
              </p>
            </div>

            <NavigationLayoutSelector
              value={navigationLayout}
              onChange={setNavigationLayout}
            />

            <div className="rounded-lg border bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">
                Current layout
              </p>
              <p className="mt-1 text-sm font-medium">
                {navigationLayout === "sidebar"
                  ? "Sidebar navigation"
                  : "Top bar navigation"}
              </p>
            </div>
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}

function NavigationLayoutSelector({
  value,
  onChange,
}: {
  value: NavigationLayout;
  onChange: (value: NavigationLayout) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <LayoutOption
        value="sidebar"
        selected={value === "sidebar"}
        title="Sidebar"
        description="Persistent navigation on the left with a compact workspace."
        onSelect={onChange}
      >
        <div className="flex h-20 overflow-hidden rounded-md border bg-white">
          <div className="w-5 border-r bg-[var(--sidebar)]" />
          <div className="flex-1 p-2">
            <div className="h-2 w-16 rounded bg-slate-200" />
            <div className="mt-2 h-2 w-12 rounded bg-slate-100" />
          </div>
        </div>
      </LayoutOption>

      <LayoutOption
        value="topbar"
        selected={value === "topbar"}
        title="Top bar"
        description="Full-width workspace with navigation across the top."
        onSelect={onChange}
      >
        <div className="h-20 overflow-hidden rounded-md border bg-white">
          <div className="h-5 bg-[var(--sidebar)]" />
          <div className="p-2">
            <div className="h-2 w-16 rounded bg-slate-200" />
            <div className="mt-2 h-2 w-12 rounded bg-slate-100" />
          </div>
        </div>
      </LayoutOption>
    </div>
  );
}

function LayoutOption({
  value,
  selected,
  title,
  description,
  onSelect,
  children,
}: {
  value: NavigationLayout;
  selected: boolean;
  title: string;
  description: string;
  onSelect: (value: NavigationLayout) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={selected}
      className={[
        "rounded-[10px] border p-3 text-left transition-all",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)] shadow-sm"
          : "hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
      ].join(" ")}
    >
      {children}

      <div className="mt-3 flex items-center gap-2">
        <span
          className={[
            "h-3 w-3 rounded-full border",
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border-strong)] bg-white",
          ].join(" ")}
        />
        <span className="text-sm font-semibold">{title}</span>
      </div>

      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {description}
      </p>
    </button>
  );
}
