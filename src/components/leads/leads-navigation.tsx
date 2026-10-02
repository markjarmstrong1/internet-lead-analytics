import Link from "next/link";

type LeadsNavigationProps = {
  active: "list" | "status";
};

export function LeadsNavigation({ active }: LeadsNavigationProps) {
  return (
    <nav aria-label="Lead views" className="relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200" />

      <div className="relative flex items-end gap-1">
        <Link
          href="/leads/list"
          className={[
            "relative rounded-t-lg border px-5 py-2.5 text-sm font-medium transition",
            active === "list"
              ? "border-slate-200 border-b-white bg-white text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          List
        </Link>

        <Link
          href="/leads/status"
          className={[
            "relative rounded-t-lg border px-5 py-2.5 text-sm font-medium transition",
            active === "status"
              ? "border-slate-200 border-b-white bg-white text-slate-950"
              : "border-transparent text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          Status
        </Link>
      </div>
    </nav>
  );
}
