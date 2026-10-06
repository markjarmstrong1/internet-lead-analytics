import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[#172033] text-white shadow-sm hover:bg-[#242e40]",
  secondary:
    "border border-[var(--border-strong)] bg-white text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-muted)]",
  ghost:
    "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
  danger:
    "border border-red-200 bg-white text-[var(--danger)] hover:bg-[var(--danger-soft)]",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
