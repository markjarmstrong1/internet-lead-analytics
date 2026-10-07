import type { ReactNode } from "react";

type ThemeSignatureProps = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export function ThemeSignature({
  primary,
  secondary,
  tertiary,
}: ThemeSignatureProps) {
  return (
    <section className="theme-signature rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="theme-signature-professional hidden items-center justify-between gap-6 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Management intelligence
          </p>
          <p className="mt-1 text-sm font-semibold">Operating picture</p>
        </div>
        <div className="grid grid-cols-3 gap-6 text-right">
          <SignatureMetric label="LEADS" value={primary} />
          <SignatureMetric label="RESPONSE" value={secondary} />
          <SignatureMetric label="OUTCOME" value={tertiary} />
        </div>
      </div>

      <div className="theme-signature-tech hidden items-center justify-between gap-5 px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="theme-live-dot" />
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--accent)]">
              SYSTEM / LIVE
            </p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">
              Internet lead telemetry
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-5 font-mono text-right">
          <SignatureMetric label="LEADS" value={primary} />
          <SignatureMetric label="RESP" value={secondary} />
          <SignatureMetric label="OUT" value={tertiary} />
        </div>
      </div>

      <div className="theme-signature-executive hidden items-center justify-between gap-8 px-6 py-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Executive brief
          </p>
          <p className="mt-1 font-serif text-lg">The numbers behind the story.</p>
        </div>
        <div className="flex items-center gap-8 text-right">
          <SignatureMetric label="Lead base" value={primary} />
          <SignatureMetric label="Response" value={secondary} />
          <SignatureMetric label="Outcome" value={tertiary} />
        </div>
      </div>

      <div className="theme-signature-performance hidden items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="theme-performance-marker">01</span>
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.1em]">
              RACE CONTROL
            </p>
            <p className="text-[10px] text-[var(--muted)]">Operating status</p>
          </div>
        </div>
        <div className="theme-performance-rule flex-1" />
        <div className="grid grid-cols-3 gap-5 font-mono text-right">
          <SignatureMetric label="LEADS" value={primary} />
          <SignatureMetric label="RESP" value={secondary} />
          <SignatureMetric label="OUT" value={tertiary} />
        </div>
      </div>
    </section>
  );
}

function SignatureMetric({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-[var(--foreground)]">
        {value}
      </p>
    </div>
  );
}
