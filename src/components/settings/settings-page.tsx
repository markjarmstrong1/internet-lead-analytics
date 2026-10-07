"use client";

import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";
import {
  setNavigationLayout,
  useNavigationLayout,
  type NavigationLayout,
} from "@/components/app/navigation-preference";
import {
  DEFAULT_APPEARANCE,
  resetAppearancePreferences,
  setAppearancePreferences,
  useAppearancePreferences,
  type AppearanceAccent,
  type AppearanceChart,
  type AppearanceDensity,
  type AppearanceMotion,
  type AppearanceRadius,
  type AppearanceTheme,
} from "@/components/app/appearance-preference";

const settings = [
  "General",
  "User preferences",
  "Dashboard preferences",
  "Default filters",
  "Report preferences",
  "Display",
  "Data preferences",
];

const themes: {
  value: AppearanceTheme;
  title: string;
  description: string;
  className: string;
  preview: string[];
}[] = [
  {
    value: "professional",
    title: "Professional",
    description: "Clean management analytics with restrained executive styling.",
    className: "bg-[#f7f7f4]",
    preview: ["bg-[#151a20]", "bg-[#b28a3b]", "bg-white"],
  },
  {
    value: "tech",
    title: "Tech",
    description: "Dark telemetry-inspired interface built for modern data work.",
    className: "bg-[#0a0d11]",
    preview: ["bg-[#07090c]", "bg-[#36d1ff]", "bg-[#11161c]"],
  },
  {
    value: "executive",
    title: "Executive",
    description: "Premium, restrained and presentation-ready for leadership.",
    className: "bg-[#f5f5f2]",
    preview: ["bg-[#17202b]", "bg-[#344b68]", "bg-white"],
  },
  {
    value: "performance",
    title: "Performance",
    description: "Dense operational interface optimized for daily analytics.",
    className: "bg-[#eef1f3]",
    preview: ["bg-[#20272e]", "bg-[#d17d21]", "bg-white"],
  },
];

const accents: {
  value: AppearanceAccent;
  title: string;
  className: string;
}[] = [
  { value: "gold", title: "Gold", className: "bg-[#b28a3b]" },
  { value: "blue", title: "Blue", className: "bg-[#3674d9]" },
  { value: "cyan", title: "Cyan", className: "bg-[#18a8c7]" },
  { value: "violet", title: "Violet", className: "bg-[#7657c7]" },
  { value: "red", title: "Red", className: "bg-[#c84b4b]" },
];

export function SettingsPage() {
  const navigationLayout = useNavigationLayout();
  const appearance = useAppearancePreferences();

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 px-6 py-8 lg:px-8">
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Configure the workspace to match how you work."
      />

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <SectionPanel title="Settings">
          <nav className="space-y-1">
            {settings.map((setting) => (
              <button
                key={setting}
                type="button"
                className={[
                  "block w-full rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-colors",
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

        <div className="space-y-6">
          <SectionPanel
            title="Interface style"
            description="Choose the visual language for the entire application."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {themes.map((theme) => (
                <ThemeOption
                  key={theme.value}
                  theme={theme}
                  selected={appearance.theme === theme.value}
                  onSelect={() =>
                    setAppearancePreferences({ theme: theme.value })
                  }
                />
              ))}
            </div>
          </SectionPanel>

          <SectionPanel
            title="Visual controls"
            description="Fine-tune the interface without changing the underlying product."
          >
            <div className="space-y-7">
              <SettingGroup title="Accent color">
                <div className="flex flex-wrap gap-3">
                  {accents.map((accent) => (
                    <button
                      key={accent.value}
                      type="button"
                      onClick={() =>
                        setAppearancePreferences({
                          accent: accent.value,
                        })
                      }
                      aria-pressed={appearance.accent === accent.value}
                      className={[
                        "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors",
                        appearance.accent === accent.value
                          ? "border-[var(--accent)] bg-[var(--accent-soft)] font-medium"
                          : "hover:bg-[var(--surface-muted)]",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "h-3.5 w-3.5 rounded-full",
                          accent.className,
                        ].join(" ")}
                      />
                      {accent.title}
                    </button>
                  ))}
                </div>
              </SettingGroup>

              <SettingGroup title="Information density">
                <Segmented
                  value={appearance.density}
                  options={[
                    ["comfortable", "Comfortable"],
                    ["standard", "Standard"],
                    ["dense", "Dense"],
                  ]}
                  onChange={(value) =>
                    setAppearancePreferences({
                      density: value as AppearanceDensity,
                    })
                  }
                />
              </SettingGroup>

              <SettingGroup title="Corner style">
                <Segmented
                  value={appearance.radius}
                  options={[
                    ["sharp", "Sharp"],
                    ["standard", "Standard"],
                    ["rounded", "Rounded"],
                  ]}
                  onChange={(value) =>
                    setAppearancePreferences({
                      radius: value as AppearanceRadius,
                    })
                  }
                />
              </SettingGroup>

              <SettingGroup title="Motion">
                <Segmented
                  value={appearance.motion}
                  options={[
                    ["full", "Full"],
                    ["reduced", "Reduced"],
                    ["minimal", "Minimal"],
                  ]}
                  onChange={(value) =>
                    setAppearancePreferences({
                      motion: value as AppearanceMotion,
                    })
                  }
                />
              </SettingGroup>

              <SettingGroup title="Chart treatment">
                <Segmented
                  value={appearance.chart}
                  options={[
                    ["standard", "Standard"],
                    ["technical", "Technical"],
                    ["minimal", "Minimal"],
                  ]}
                  onChange={(value) =>
                    setAppearancePreferences({
                      chart: value as AppearanceChart,
                    })
                  }
                />
              </SettingGroup>
            </div>
          </SectionPanel>

          <SectionPanel
            title="Navigation"
            description="Choose how the application organizes its primary navigation."
          >
            <NavigationLayoutSelector
              value={navigationLayout}
              onChange={setNavigationLayout}
            />
          </SectionPanel>

          <SectionPanel
            title="Reset appearance"
            description="Return all visual preferences to the default Professional configuration."
          >
            <button
              type="button"
              onClick={resetAppearancePreferences}
              className="rounded-[var(--radius-md)] border border-[var(--border-strong)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--surface-muted)]"
            >
              Reset appearance
            </button>

            <p className="mt-3 text-xs text-[var(--muted)]">
              Default: {DEFAULT_APPEARANCE.theme} theme,{" "}
              {DEFAULT_APPEARANCE.accent} accent,{" "}
              {DEFAULT_APPEARANCE.density} density.
            </p>
          </SectionPanel>
        </div>
      </div>
    </div>
  );
}

function ThemeOption({
  theme,
  selected,
  onSelect,
}: {
  theme: (typeof themes)[number];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        "rounded-[var(--radius-lg)] border p-3 text-left transition-colors",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
          : "hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]",
      ].join(" ")}
    >
      <div
        className={[
          "relative h-28 overflow-hidden rounded-[var(--radius-md)] border",
          theme.className,
        ].join(" ")}
      >
        <div className="absolute inset-y-0 left-0 w-8 bg-black/70" />
        <div className="absolute left-12 right-3 top-4 h-3 rounded bg-black/10" />
        <div className="absolute left-12 top-12 flex gap-2">
          {theme.preview.map((color) => (
            <span
              key={color}
              className={`h-7 w-12 rounded ${color}`}
            />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={[
            "h-3 w-3 rounded-full border",
            selected
              ? "border-[var(--accent)] bg-[var(--accent)]"
              : "border-[var(--border-strong)]",
          ].join(" ")}
        />
        <span className="text-sm font-semibold">{theme.title}</span>
      </div>

      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
        {theme.description}
      </p>
    </button>
  );
}

function SettingGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex flex-wrap rounded-[var(--radius-md)] border bg-[var(--surface-muted)] p-1">
      {options.map(([option, label]) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          aria-pressed={value === option}
          className={[
            "rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
            value === option
              ? "bg-[var(--surface)] font-medium text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
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
        description="Persistent navigation on the left."
        onSelect={onChange}
      >
        <div className="flex h-20 overflow-hidden rounded-[var(--radius-md)] border bg-[var(--surface)]">
          <div className="w-5 border-r bg-[var(--sidebar)]" />
          <div className="flex-1 p-2">
            <div className="h-2 w-16 rounded bg-[var(--border-strong)]" />
            <div className="mt-2 h-2 w-12 rounded bg-[var(--surface-muted)]" />
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
        <div className="h-20 overflow-hidden rounded-[var(--radius-md)] border bg-[var(--surface)]">
          <div className="h-5 bg-[var(--sidebar)]" />
          <div className="p-2">
            <div className="h-2 w-16 rounded bg-[var(--border-strong)]" />
            <div className="mt-2 h-2 w-12 rounded bg-[var(--surface-muted)]" />
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
        "rounded-[var(--radius-lg)] border p-3 text-left transition-colors",
        selected
          ? "border-[var(--accent)] bg-[var(--accent-soft)]"
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
              : "border-[var(--border-strong)] bg-[var(--surface)]",
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
