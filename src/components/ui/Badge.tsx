import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral" | "brand" | "accent" | "success" | "warning" | "danger" | "verified" | "sponsored";

const VARIANTS: Record<BadgeVariant, string> = {
  neutral:   "bg-ink-100 text-ink-600 border-ink-200",
  brand:     "bg-brand-50 text-brand-700 border-brand-100",
  accent:    "bg-accent-50 text-accent-700 border-accent-200",
  success:   "bg-success-50 text-success-700 border-success-500/20",
  warning:   "bg-warning-50 text-warning-700 border-warning-500/20",
  danger:    "bg-danger-50 text-danger-700 border-danger-500/20",
  // "מאומת" מקבל כחול מלא ולא רקע חיוור — זה תג אמון, הוא צריך לבלוט
  verified:  "bg-brand-800 text-white border-brand-800",
  // "ממומן" בכוונה שקט. פרסום שצועק פוגע באמון בכל הרשימה.
  sponsored: "bg-white/85 text-ink-500 border-ink-200 backdrop-blur-sm",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export function Badge({ children, variant = "neutral", icon, className, size = "sm" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold",
        "whitespace-nowrap leading-none",
        size === "sm" ? "px-2.5 py-1 text-2xs" : "px-3 py-1.5 text-xs",
        VARIANTS[variant],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
