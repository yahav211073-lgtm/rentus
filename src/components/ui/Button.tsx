"use client";

import Link from "next/link";
import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * כפתור.
 *
 * שתי החלטות שכדאי לשים לב אליהן:
 *
 * 1. ה-hover מרים ב-1px בלבד (‎-translate-y-px‎). זה נשמע כמו כלום, וזה
 *    בדיוק העניין — הרמה של 4px מרגישה זולה, הרמה של 1px מרגישה יקרה.
 *
 * 2. ה-active מחזיר ל-0 ומקטין את הצל. משוב מישוש שגורם ללחיצה
 *    להרגיש כמו לחיצה על משהו פיזי ולא כמו שינוי צבע.
 */

type Variant = "primary" | "accent" | "secondary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg" | "xl" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: cn(
    "bg-gradient-to-b from-brand-700 to-brand-800 text-white",
    "shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset,0_8px_20px_-8px_rgba(11,59,117,0.6)]",
    "hover:from-brand-600 hover:to-brand-700",
    "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.22)_inset,0_14px_28px_-10px_rgba(11,59,117,0.55)]",
  ),
  accent: cn(
    "bg-gradient-to-b from-accent-300 to-accent-400 text-brand-950 font-bold",
    "shadow-[0_1px_0_0_rgba(255,255,255,0.5)_inset,0_8px_20px_-8px_rgba(237,175,0,0.65)]",
    "hover:from-accent-200 hover:to-accent-300",
    "hover:shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset,0_14px_30px_-10px_rgba(237,175,0,0.6)]",
  ),
  secondary: cn(
    "bg-white text-brand-800 border border-ink-200",
    "shadow-sm hover:border-brand-300 hover:shadow-md hover:text-brand-700",
  ),
  outline: cn(
    "bg-transparent text-brand-800 border-2 border-brand-800/25",
    "hover:border-brand-800/60 hover:bg-brand-50",
  ),
  ghost: "bg-transparent text-ink-700 hover:bg-ink-100 hover:text-brand-800",
  danger: "bg-danger-500 text-white shadow-sm hover:bg-danger-700",
};

const SIZES: Record<Size, string> = {
  sm:   "h-9  px-3.5 text-sm gap-1.5 rounded-xs",
  md:   "h-11 px-5   text-base gap-2 rounded-xs",
  lg:   "h-13 px-7   text-md gap-2.5 rounded-sm",
  xl:   "h-15 px-9   text-lg gap-3 rounded-sm",
  icon: "h-11 w-11 rounded-xs",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
  /** אייקון שמופיע בצד ההתחלה (ימין ב-RTL) */
  icon?: ReactNode;
  /** אייקון בצד הסיום */
  iconEnd?: ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const base = cn(
  "relative inline-flex items-center justify-center font-semibold",
  "transition-[transform,box-shadow,background-color,border-color,color]",
  "duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
  "hover:-translate-y-px active:translate-y-0 active:scale-[0.985]",
  "disabled:pointer-events-none disabled:opacity-50",
  "whitespace-nowrap select-none",
);

export type ButtonProps = BaseProps & ComponentPropsWithoutRef<"button">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", className, children, icon, iconEnd,
    loading, fullWidth, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Spinner /> : icon}
      {children}
      {!loading && iconEnd}
    </button>
  );
});

export type ButtonLinkProps = BaseProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & { href: string };

export function ButtonLink({
  variant = "primary", size = "md", className, children, icon, iconEnd, fullWidth, ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className)}
      {...props}
    >
      {icon}
      {children}
      {iconEnd}
    </Link>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
      <path className="opacity-90" fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-3a7 7 0 0 0-7-7V2z" />
    </svg>
  );
}
