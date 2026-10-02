import { AppShell } from "@/components/app/app-shell";
import { LeadDetailPage } from "@/components/leads/lead-detail-page";

type LeadRouteProps = {
  params: Promise<{
    leadId: string;
  }>;
};

export default async function LeadRoute({
  params,
}: LeadRouteProps) {
  const { leadId } = await params;

  return (
    <AppShell>
      <LeadDetailPage leadId={leadId} />
    </AppShell>
  );
}
