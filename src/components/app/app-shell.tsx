"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { useNavigationLayout } from "./navigation-preference";

const navigation = [
  { label: "Dashboard", href: "/" },
  { label: "Leads", href: "/leads" },
  { label: "Analytics", href: "/analytics" },
  { label: "Reports", href: "/reports" },
  { label: "Methods", href: "/methods" },
  { label: "Intake", href: "/import" },
  { label: "Settings", href: "/settings" },
];

const DEFAULT_WIDTH = 208;
const MIN_WIDTH = 180;
const MAX_WIDTH = 320;
const COLLAPSED_WIDTH = 64;
const SIDEBAR_WIDTH_KEY = "ila-sidebar-width";
const SIDEBAR_COLLAPSED_KEY = "ila-sidebar-collapsed";
const SIDEBAR_PREFERENCE_EVENT = "ila-sidebar-preference-change";

function subscribeSidebarPreference(callback: () => void) {
  window.addEventListener(SIDEBAR_PREFERENCE_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(SIDEBAR_PREFERENCE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getStoredSidebarWidth() {
  if (typeof window === "undefined") return DEFAULT_WIDTH;

  const stored = Number(window.localStorage.getItem(SIDEBAR_WIDTH_KEY));

  return Number.isFinite(stored)
    ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, stored))
    : DEFAULT_WIDTH;
}

function getStoredSidebarCollapsed() {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

function emitSidebarPreferenceChange() {
  window.dispatchEvent(new Event(SIDEBAR_PREFERENCE_EVENT));
}

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const navigationLayout = useNavigationLayout();
  const sidebarWidth = useSyncExternalStore(
    subscribeSidebarPreference,
    getStoredSidebarWidth,
    () => DEFAULT_WIDTH,
  );
  const collapsed = useSyncExternalStore(
    subscribeSidebarPreference,
    getStoredSidebarCollapsed,
    () => false,
  );


  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    if (collapsed) return;

    event.currentTarget.setPointerCapture(event.pointerId);

    const startX = event.clientX;
    const startWidth = sidebarWidth;

    function handleMove(moveEvent: PointerEvent) {
      const nextWidth = Math.min(
        MAX_WIDTH,
        Math.max(MIN_WIDTH, startWidth + moveEvent.clientX - startX),
      );

      window.localStorage.setItem(
        SIDEBAR_WIDTH_KEY,
        String(nextWidth),
      );
      emitSidebarPreferenceChange();
    }

    function handleUp() {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp, { once: true });
  }

  const desktopWidth = collapsed ? COLLAPSED_WIDTH : sidebarWidth;

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)]"
      style={
        {
          "--sidebar-width": `${desktopWidth}px`,
        } as React.CSSProperties
      }
    >
      {navigationLayout === "topbar" ? (
        <TopBarNavigation pathname={pathname} />
      ) : null}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)]",
          navigationLayout === "sidebar" ? "lg:flex" : "lg:hidden",
        ].join(" ")}
        style={{ width: "var(--sidebar-width)" }}
      >
        <div
          className={[
            "flex h-16 items-center border-b border-[var(--sidebar-border)]",
            collapsed ? "justify-center px-2" : "px-4",
          ].join(" ")}
        >
          {collapsed ? (
            <Link
              href="/"
              aria-label="Internet Lead Analytics home"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.08] text-xs font-bold text-white"
            >
              ILA
            </Link>
          ) : (
            <Link
              href="/"
              className="truncate text-sm font-semibold tracking-tight text-white"
            >
              Internet Lead Analytics
            </Link>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-5">
          {!collapsed ? (
            <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">
              Workspace
            </p>
          ) : null}

          <nav
            aria-label="Primary navigation"
            className="mt-2 space-y-1"
          >
            {navigation.slice(0, 5).map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {!collapsed ? (
            <p className="mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--sidebar-muted)]">
              Administration
            </p>
          ) : null}

          <nav
            aria-label="Administration"
            className="mt-2 space-y-1"
          >
            {navigation.slice(5).map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>

        {!collapsed ? (
          <div className="border-t border-[var(--sidebar-border)] p-3">
            <p className="text-xs font-medium text-white">
              Evidence first
            </p>
            <p className="mt-1 text-xs leading-5 text-[var(--sidebar-muted)]">
              Management intelligence from lead activity.
            </p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(
              SIDEBAR_COLLAPSED_KEY,
              String(!collapsed),
            );
            emitSidebarPreferenceChange();
          }}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={[
            "absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full",
            "border border-[var(--border-strong)] bg-white text-xs font-semibold text-[var(--muted-strong)]",
            "shadow-sm transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
          ].join(" ")}
        >
          {collapsed ? "›" : "‹"}
        </button>

        {!collapsed ? (
          <div
            role="separator"
            aria-label="Resize sidebar"
            aria-orientation="vertical"
            onPointerDown={startResize}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize transition-colors hover:bg-[var(--accent)]"
          />
        ) : null}
      </aside>

      <div
        className="transition-[padding] duration-150"
        style={{
          paddingLeft:
            navigationLayout === "sidebar"
              ? "var(--sidebar-width)"
              : "0px",
        }}
      >
        <header
          className={[
            "border-b bg-white/95 backdrop-blur",
            navigationLayout === "topbar" ? "lg:hidden" : "",
          ].join(" ")}
        >
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

function SidebarLink({
  item,
  pathname,
  collapsed,
}: {
  item: { label: string; href: string };
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname === item.href ||
        pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={[
        "relative flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
        collapsed ? "justify-center px-2" : "px-3",
        isActive
          ? "bg-white/[0.08] text-white"
          : "text-[var(--sidebar-muted)] hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      {isActive ? (
        <span className="absolute left-0 h-5 w-0.5 rounded-full bg-[var(--accent)]" />
      ) : null}

      {collapsed ? (
        <span className="text-xs font-bold">
          {item.label.slice(0, 1)}
        </span>
      ) : (
        item.label
      )}
    </Link>
  );
}


function TopBarNavigation({ pathname }: { pathname: string }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="sticky top-0 z-40 hidden h-16 border-b bg-[var(--sidebar)] lg:flex"
    >
      <div className="mx-auto grid h-16 w-full max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 lg:gap-6 lg:px-8">
        <Link
          href="/"
          className="min-w-0 truncate text-sm font-semibold tracking-tight text-white"
        >
          Internet Lead Analytics
        </Link>

        <div className="w-[min(30vw,420px)]">
          <input
            type="search"
            placeholder="Search leads, metrics, reports..."
            aria-label="Smart search"
            className="w-full rounded-lg border border-white/10 bg-white/[0.08] px-4 py-2 text-sm text-white outline-none placeholder:text-[var(--sidebar-muted)] focus:border-[var(--accent)] focus:bg-white/[0.12]"
          />
        </div>

        <div className="flex items-center justify-end gap-0.5 whitespace-nowrap lg:gap-1">
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
                  "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/[0.08] text-white"
                    : "text-[var(--sidebar-muted)] hover:bg-white/[0.05] hover:text-white",
                ].join(" ")}
              >
                {isActive ? (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-[var(--accent)]" />
                ) : null}
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
