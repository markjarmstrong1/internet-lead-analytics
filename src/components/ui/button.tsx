import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--button-primary)] text-[var(--button-primary-foreground)] shadow-sm hover:bg-[var(--button-primary-hover)]",
  secondary:
    "border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] shadow-sm hover:bg-[var(--surface-muted)]",
  ghost:
    "text-[var(--muted-strong)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
  danger:
    "border border-[var(--danger)] bg-[var(--surface)] text-[var(--danger)] hover:bg-[var(--danger-soft)]",
};

export function Button({
  variant = "secondary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] px-3.5 py-2 text-sm font-medium transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
}
