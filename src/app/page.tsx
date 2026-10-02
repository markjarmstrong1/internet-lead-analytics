import { AppShell } from "@/components/app/app-shell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export default function Home() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
