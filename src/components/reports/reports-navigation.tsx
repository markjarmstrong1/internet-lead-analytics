"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Overview", href: "/reports", exact: true },
  { label: "Report builder", href: "/reports/builder" },
  { label: "Report library", href: "/reports/view" },
  { label: "Template analysis", href: "/reports/template-responses" },
];

export function ReportsNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Reports navigation"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm"
    >
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "shrink-0 rounded-lg px-3.5 py-2.5 text-sm font-medium transition",
              active
                ? "bg-slate-950 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
