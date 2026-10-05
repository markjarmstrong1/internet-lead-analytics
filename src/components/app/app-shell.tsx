"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Methods", href: "/methods" },
  { label: "Imports", href: "/import" },
  { label: "Settings", href: "/settings" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1600px] items-center gap-6 px-6 lg:px-8">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-tight"
          >
            Internet Lead Analytics
          </Link>

          <div className="flex min-w-0 flex-1 justify-center">
            <input
              type="search"
              placeholder="Search leads, metrics, reports..."
              aria-label="Smart search"
              className="w-full max-w-xl rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-slate-500"
            />
          </div>

          <nav
            aria-label="Primary navigation"
            className="flex shrink-0 items-center gap-1"
          >
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(
                      `${item.href}/`,
                    );

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive
                      ? "bg-slate-950 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
