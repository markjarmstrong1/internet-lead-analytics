"use client";

import Link from "next/link";
import { useState } from "react";

type WorkspaceTab = "terminal" | "files" | "git";

const tabs: { id: WorkspaceTab; label: string; description: string }[] = [
  { id: "terminal", label: "Terminal", description: "Run approved project commands through the local agent." },
  { id: "files", label: "Files", description: "Browse and edit files inside the repository boundary." },
  { id: "git", label: "Git", description: "Review the branch, working tree, and diffs before changes are committed." },
];

const approvedCommands = [
  { command: "npm test -- --run", detail: "Run the test suite" },
  { command: "npm run lint", detail: "Check code quality" },
  { command: "npm run build", detail: "Verify the production build" },
];

export default function DeveloperWorkspacePage() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("terminal");

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-8 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto max-w-[1440px] space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[var(--border)] pb-7">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Workspace / Developer
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Developer workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-strong)] sm:text-base">
              A controlled workspace for maintaining MANTIK in your existing local project folder.
            </p>
          </div>
          <Link href="/app/v0" className="rounded-md border border-[var(--border-strong)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-muted)]">
            Back to MANTIK
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-3" aria-label="Workspace capabilities">
          <StatusCard label="Execution location" value="Local Mac" detail="~/Desktop/internet-lead-analytics" />
          <StatusCard label="Local agent" value="Not connected" detail="No commands can run from this page yet." warning />
          <StatusCard label="Access policy" value="Restricted by design" detail="No public shell endpoint or arbitrary command API." />
        </section>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-1 border-b border-[var(--border)] bg-[var(--surface-muted)] p-2" role="tablist" aria-label="Developer tools">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-[var(--surface)] text-[var(--foreground)] shadow-sm" : "text-[var(--muted-strong)] hover:text-[var(--foreground)]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "terminal" && (
            <div className="grid gap-0 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="min-w-0">
                <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-semibold">Project terminal</h2>
                    <p className="mt-1 text-xs text-[var(--muted)]">Local execution · allowlisted commands only</p>
                  </div>
                  <span className="rounded-full border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-2.5 py-1 text-xs font-medium text-[var(--warning)]">Agent offline</span>
                </div>
                <div className="min-h-[320px] bg-[#10151b] p-5 font-mono text-xs leading-6 text-slate-300 sm:p-7">
                  <p className="text-emerald-400">MANTIK Developer Workspace</p>
                  <p className="text-slate-500">Target: ~/Desktop/internet-lead-analytics</p>
                  <p className="mt-4 text-slate-400">The interface is ready. Connect the local agent to enable execution.</p>
                  <p className="mt-2 text-amber-300">Safety: no arbitrary shell commands are accepted by the web application.</p>
                  <div className="mt-8 flex items-center gap-2 border-t border-slate-700 pt-4 text-slate-500">
                    <span aria-hidden="true">$</span>
                    <span>terminal input disabled until local agent is installed</span>
                    <span className="h-4 w-1 animate-pulse bg-slate-500" aria-hidden="true" />
                  </div>
                </div>
              </div>
              <aside className="border-t border-[var(--border)] p-5 xl:border-l xl:border-t-0">
                <h3 className="text-sm font-semibold">Approved commands</h3>
                <p className="mt-1 text-xs leading-5 text-[var(--muted)]">The first agent version will expose named development tasks, not a general-purpose shell.</p>
                <div className="mt-4 space-y-3">
                  {approvedCommands.map((item) => (
                    <div key={item.command} className="rounded-lg border border-[var(--border)] p-3 opacity-70">
                      <code className="block break-all text-xs">{item.command}</code>
                      <p className="mt-2 text-xs text-[var(--muted)]">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}

          {activeTab === "files" && (
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr] lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Repository boundary</p>
                <h2 className="mt-2 text-xl font-semibold">Project files</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-strong)]">File browsing and editing will be rooted at the existing repository. Path traversal, symlink escapes, environment files, and Git internals will be blocked by the local agent.</p>
              </div>
              <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-5">
                <p className="text-sm font-medium">Waiting for local agent</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Once connected, this panel will show the repository tree and a bounded file editor. No files are currently being read or changed.</p>
              </div>
            </div>
          )}

          {activeTab === "git" && (
            <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1fr] lg:p-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Source control</p>
                <h2 className="mt-2 text-xl font-semibold">Git inspection</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-strong)]">The initial Git panel will show the current branch, working-tree status, changed files, and reviewed diffs. Commit and push actions are intentionally excluded from this first version.</p>
              </div>
              <div className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-muted)] p-5">
                <p className="text-sm font-medium">Waiting for local agent</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">No Git commands have been executed by this page. Your existing repository remains untouched.</p>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
          <h2 className="text-sm font-semibold">Local agent setup</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">
            This page does not execute commands itself. The next implementation step is a small Node.js process on your Mac, bound to loopback, with origin checks, a short-lived pairing token, strict repository path validation, command allowlisting, output limits, and request timeouts.
          </p>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">Do not expose the local agent through a public tunnel or bind it to 0.0.0.0. The deployed MANTIK app must never proxy arbitrary shell input.</p>
        </section>
      </div>
    </main>
  );
}

function StatusCard({ label, value, detail, warning = false }: { label: string; value: string; detail: string; warning?: boolean }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{label}</p>
      <p className={`mt-3 text-lg font-semibold ${warning ? "text-[var(--warning)]" : "text-[var(--foreground)]"}`}>{value}</p>
      <p className="mt-2 text-sm leading-5 text-[var(--muted-strong)]">{detail}</p>
    </article>
  );
}
