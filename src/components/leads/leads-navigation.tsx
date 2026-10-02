import Link from "next/link";

type LeadsNavigationProps = {
  active: "list" | "status";
};

export function LeadsNavigation({ active }: LeadsNavigationProps) {
  return (
    <nav aria-label="Lead views" className="relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-slate-200" />

      <div className="relative mx-auto flex w-full max-w-5xl items-end gap-1 px-4">
        <Link
          href="/leads/list"
          className={[
            "relative z-10 flex flex-1 items-center justify-center rounded-t-lg px-5 py-3 text-sm font-medium transition",
            active === "list"
              ? "border border-slate-200 border-b-white bg-white text-slate-950"
              : "border border-transparent text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          List
        </Link>

        <Link
          href="/leads/status"
          className={[
            "relative z-10 flex flex-1 items-center justify-center rounded-t-lg px-5 py-3 text-sm font-medium transition",
            active === "status"
              ? "border border-slate-200 border-b-white bg-white text-slate-950"
              : "border border-transparent text-slate-500 hover:text-slate-900",
          ].join(" ")}
        >
          Status
        </Link>
      </div>
    </nav>
  );
}
