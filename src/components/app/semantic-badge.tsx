import type { ReactNode } from "react";

type SemanticBadgeTone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "unknown";

type SemanticBadgeProps = {
  children: ReactNode;
  tone?: SemanticBadgeTone;
};

const toneClasses: Record<SemanticBadgeTone, string> = {
  neutral: "border-slate-200 bg-slate-50 text-slate-600",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  negative: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  info: "border-blue-200 bg-blue-50 text-blue-700",
  unknown: "border-slate-200 bg-white text-slate-400",
};

export function SemanticBadge({
  children,
  tone = "neutral",
}: SemanticBadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        toneClasses[tone],
      ].join(" ")}
    >
      {children}
    </span>
  );
}
