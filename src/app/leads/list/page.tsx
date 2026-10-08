import { AppShell } from "@/components/app/app-shell";
import { LeadListPage } from "@/components/leads/lead-list-page";

type LeadListRouteProps = {
  searchParams: Promise<{
    status?: string;
    stage?: string;
    sourceGroup?: string;
    leadIds?: string;
  }>;
};

export default async function LeadListRoute({
  searchParams,
}: LeadListRouteProps) {
  return (
    <AppShell>
      <LeadListPage searchParams={searchParams} />
    </AppShell>
  );
}
