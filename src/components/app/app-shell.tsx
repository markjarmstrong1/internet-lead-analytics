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
  { label: "Intake", href: "/import" },
  { label: "Settings", href: "/settings" },
];

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] lg:flex">
        <div className="flex h-16 items-center border-b border-[var(--sidebar-border)] px-5">
          <Link href="/" className="text-sm font-semibold tracking-tight text-white">
            Internet Lead Analytics
          </Link>
        </div>

        <div className="px-3 py-5">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">
            Workspace
          </p>

          <nav aria-label="Primary navigation" className="mt-2 space-y-1">
            {navigation.slice(0, 5).map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-[var(--sidebar-muted)] hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  {isActive ? (
                    <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[var(--accent)]" />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <p className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">
            Administration
          </p>

          <nav aria-label="Administration" className="mt-2 space-y-1">
            {navigation.slice(5).map((item) => {
              const isActive =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "relative flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-[var(--sidebar-muted)] hover:bg-white/[0.05] hover:text-white",
                  ].join(" ")}
                >
                  {isActive ? (
                    <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[var(--accent)]" />
                  ) : null}
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto border-t border-[var(--sidebar-border)] p-4">
          <p className="text-xs font-medium text-white">Evidence first</p>
          <p className="mt-1 text-xs leading-5 text-[var(--sidebar-muted)]">
            Management intelligence from lead activity.
          </p>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-4 px-5 lg:px-8">
            <Link
              href="/"
              className="shrink-0 text-sm font-semibold tracking-tight lg:hidden"
            >
              Internet Lead Analytics
            </Link>

            <div className="flex min-w-0 flex-1 justify-center">
              <input
                type="search"
                placeholder="Search leads, metrics, reports..."
                aria-label="Smart search"
                className="w-full max-w-xl rounded-lg border bg-[var(--surface-muted)] px-4 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white"
              />
            </div>
          </div>

          <nav
            aria-label="Mobile navigation"
            className="flex gap-1 overflow-x-auto border-t px-3 py-2 lg:hidden"
          >
            {navigation.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium",
                    isActive
                      ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)]",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        <main>{children}</main>
      </div>
    </div>
  );
}
