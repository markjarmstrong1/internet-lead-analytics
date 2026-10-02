import { PageHeader } from "@/components/app/page-header";
import { SectionPanel } from "@/components/app/section-panel";

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
                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              >
                {setting}
              </button>
            ))}
          </nav>
        </SectionPanel>

        <SectionPanel
          title="Configuration"
          description="Select a setting category to configure the application."
        >
          <div className="min-h-96 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-400">
            Settings workspace
          </div>
        </SectionPanel>
      </div>
    </div>
  );
}
