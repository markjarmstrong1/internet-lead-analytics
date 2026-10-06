import Link from "next/link";
import type { ReactNode } from "react";

import { AppShell } from "@/components/app/app-shell";
import { EvidenceLegend } from "@/components/app/evidence-legend";
import { PageHeader } from "@/components/app/page-header";

const sections = [
  { label: "Overview", href: "/analytics" },
  { label: "Acquisition", href: "/analytics/acquisition" },
  { label: "Contact", href: "/analytics/contact" },
  { label: "Engagement", href: "/analytics/engagement" },
  { label: "Progression", href: "/analytics/progression" },
  { label: "Sources", href: "/analytics/sources" },
  { label: "Trends", href: "/analytics/trends" },
  { label: "Sold Leads", href: "/analytics/sold" },
  { label: "Investigation", href: "/analytics/investigation" },
] as const;

type AnalyticsLayoutProps = {
  active: (typeof sections)[number]["href"];
  title: string;
  description: string;
  children: ReactNode;
};

export function AnalyticsLayout({
  active,
  title,
  description,
  children,
}: AnalyticsLayoutProps) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1600px] space-y-6 px-6 py-8 lg:px-8">
        <PageHeader
          eyebrow="Analytics"
          title={title}
          description={description}
        />

        <EvidenceLegend />

        <nav
          aria-label="Analytics views"
          className="overflow-x-auto border-b border-slate-200"
        >
          <div className="flex min-w-max gap-1">
            {sections.map((section) => {
              const selected = section.href === active;

              return (
                <Link
                  key={section.href}
                  href={section.href}
                  className={[
                    "border-b-2 px-4 py-3 text-sm font-medium",
                    selected
                      ? "border-slate-950 text-slate-950"
                      : "border-transparent text-slate-500 hover:text-slate-950",
                  ].join(" ")}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {children}
      </div>
    </AppShell>
  );
}
