import { AppShell } from "@/components/app/app-shell";
import { LeadListPage } from "@/components/leads/lead-list-page";

export default function LeadListRoute() {
  return (
    <AppShell>
      <LeadListPage />
    </AppShell>
  );
}
