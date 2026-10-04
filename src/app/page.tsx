import { AppShell } from "@/components/app/app-shell";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <AppShell>
      <DashboardPage />
    </AppShell>
  );
}
