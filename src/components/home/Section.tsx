import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";

/**
 * מעטפת סקציה + כותרת.
 *
 * הכותרת בנויה משלוש שכבות: eyebrow קטן, כותרת, ותת-כותרת.
 * ה-eyebrow הוא מה שנותן לכל סקציה זהות משלה בלי לשנות את מבנה
 * העמוד — הוא צבוע לפי הסקציה, והכותרת נשארת עקבית.
 */

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  /** רוחב מלא לרצועות גלילה שחייבות לגעת בקצה המסך */
  bleed?: boolean;
  id?: string;
}

export function Section({ children, className, id }: SectionProps) {
  return (
    /* py-10 במובייל ולא py-16.
       64px למעלה ו-64 למטה על מסך של 844px פירושו ש-15% מהמסך הוא
       חלל בין סקציות, לפני שנספר את המרווח שבתוכן. ביחס לדסקטופ
       (96px מתוך 900) זה כמעט פי שניים — כלומר לא "פחות אוויר
       במובייל" אלא יותר. 40px שומר על ההפרדה ומחזיר את היחס. */
    <section id={id} className={cn("py-10 sm:py-16 lg:py-24", className)}>
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

interface HeadingProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** קישור "לכל..." בצד הנגדי */
  action?: { label: string; href: string };
  align?: "start" | "center";
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({
  eyebrow, title, subtitle, action, align = "start", tone = "light", className,
}: HeadingProps) {
  const dark = tone === "dark";

  return (
    <Reveal className={cn("mb-6 sm:mb-10 lg:mb-12", className)}>
      <div className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
      )}>
        <div className={cn("max-w-2xl", align === "center" && "text-center")}>
          {eyebrow && (
            <span className={cn(
              "mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-2xs font-bold tracking-wider sm:mb-3",
              dark ? "bg-white/10 text-accent-300" : "bg-brand-50 text-brand-700",
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", dark ? "bg-accent-400" : "bg-brand-500")} />
              {eyebrow}
            </span>
          )}
          <h2 className={cn(
            "font-display text-2xl font-extrabold sm:text-3xl lg:text-4xl",
            dark ? "text-white" : "text-ink-900",
          )}>
            {title}
          </h2>
          {subtitle && (
            <p className={cn(
              "mt-2 text-sm leading-relaxed sm:mt-3 sm:text-md",
              dark ? "text-white/65" : "text-ink-500",
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {action && (
          <Link
            href={action.href}
            className={cn(
              "group inline-flex shrink-0 items-center gap-1.5 rounded-xs border px-4 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5",
              dark
                ? "border-white/18 text-white hover:border-accent-400/60 hover:bg-white/10"
                : "border-ink-200 text-brand-700 hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            {action.label}
            <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        )}
      </div>
    </Reveal>
  );
}
