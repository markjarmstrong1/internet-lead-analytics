import { AppShell } from "@/components/app/app-shell";
import { SettingsPage } from "@/components/settings/settings-page";

export default function SettingsRoute() {
  return (
    <AppShell>
      <SettingsPage />
    </AppShell>
  );
}
