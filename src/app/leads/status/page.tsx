import { AppShell } from "@/components/app/app-shell";
import { LeadStatusPage } from "@/components/leads/lead-status-page";

export default function LeadStatusRoute() {
  return (
    <AppShell>
      <LeadStatusPage />
    </AppShell>
  );
}
