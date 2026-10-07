"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type SearchLead = {
  id: string;
  name: string;
  leadId: string;
  source: string;
  status: string;
  stage: string;
};

type GlobalSearchProps = {
  variant?: "light" | "dark";
};

export function GlobalSearch({
  variant = "light",
}: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchLead[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const value = query.trim();

    if (value.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timeout = window.setTimeout(async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `/api/search/leads?q=${encodeURIComponent(value)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = (await response.json()) as {
          leads?: SearchLead[];
        };

        setResults(data.leads ?? []);
        setOpen(true);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  const isDark = variant === "dark";

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setOpen(true);
          }
        }}
        placeholder="Search leads..."
        aria-label="Search leads"
        role="combobox"
      role="combobox"
      aria-expanded={open}
      aria-controls="global-search-results"
      aria-autocomplete="list"
      aria-controls="global-search-results"
      aria-autocomplete="list"
        aria-controls="global-search-results"
        className={[
          "w-full rounded-lg border px-4 py-2 text-sm outline-none",
          isDark
            ? "border-white/10 bg-white/[0.08] text-white placeholder:text-[var(--sidebar-muted)] focus:border-[var(--accent)] focus:bg-white/[0.12]"
            : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus:bg-white",
        ].join(" ")}
      />

      {open && query.trim().length >= 2 ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-lg"
        >
          {loading ? (
            <div className="px-4 py-4 text-sm text-[var(--muted)]">
              Searching leads...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No leads found
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Try a customer name or lead ID.
              </p>
            </div>
          ) : (
            <div className="py-1">
              {results.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/leads/${lead.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                  }}
                  className="block border-b border-[var(--border)] px-4 py-3 last:border-b-0 hover:bg-[var(--surface-muted)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-medium text-[var(--foreground)]">
                      {lead.name}
                    </span>

                    {lead.status ? (
                      <span className="shrink-0 text-xs text-[var(--muted)]">
                        {lead.status}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-1 flex min-w-0 gap-3 text-xs text-[var(--muted)]">
                    {lead.leadId ? (
                      <span className="truncate">
                        {lead.leadId}
                      </span>
                    ) : null}

                    {lead.source ? (
                      <span className="truncate">
                        {lead.source}
                      </span>
                    ) : null}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
