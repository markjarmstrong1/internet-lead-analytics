import Link from "next/link";

type LeadsNavigationProps = {
  active: "list" | "status";
};

export function LeadsNavigation({ active }: LeadsNavigationProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Link
        href="/leads/list"
        className={[
          "rounded-xl border p-5 transition",
          active === "list"
            ? "border-slate-950 bg-slate-950 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
        ].join(" ")}
      >
        <p className="text-sm font-semibold">Lead list</p>
        <p
          className={[
            "mt-1 text-xs",
            active === "list" ? "text-slate-300" : "text-slate-500",
          ].join(" ")}
        >
          Search, filter, and open individual leads
        </p>
      </Link>

      <Link
        href="/leads/status"
        className={[
          "rounded-xl border p-5 transition",
          active === "status"
            ? "border-slate-950 bg-slate-950 text-white"
            : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
        ].join(" ")}
      >
        <p className="text-sm font-semibold">Lead status</p>
        <p
          className={[
            "mt-1 text-xs",
            active === "status" ? "text-slate-300" : "text-slate-500",
          ].join(" ")}
        >
          See where leads are in the customer journey
        </p>
      </Link>
    </div>
  );
}
