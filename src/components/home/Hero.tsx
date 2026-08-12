"use client";

import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BadgeCheck, ShieldCheck, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { seedCategories, seedTrendingSearches } from "@/data/seed";

/**
 * ההירו.
 *
 * · הרקע נע לאט יותר מהתוכן בגלילה (parallax קל, 0→90px). זה
 *   נעשה עם useScroll/useTransform ולא עם background-attachment:fixed,
 *   שנשבר במובייל ומחייב repaint בכל פריים.
 *
 * · האלמנטים הצפים מונפשים ב-CSS ולא ב-JS. אנימציית transform
 *   טהורה רצה על ה-compositor ולא נוגעת ב-main thread — זה ההבדל
 *   בין 60fps ל-jank בזמן גלילה.
 *
 * · הכותרת נכנסת במילים מדורגות. ה-delay מצטבר קטן (0.05) —
 *   מספיק כדי להרגיש חי, לא מספיק כדי לעכב את הקריאה.
 */

const TRUST_POINTS = [
  { Icon: BadgeCheck, label: "14,200 עסקים מאומתים" },
  { Icon: ShieldCheck, label: "ביקורות מאומתות בלבד" },
  { Icon: TrendingUp, label: "38,000 פניות בחודש" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 90]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, reduced ? 1 : 0.25]);

  const headline = ["כל", "העסקים", "בישראל", "—", "במקום", "אחד"];

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden pb-20 pt-[calc(var(--spacing-header)+56px)] sm:pb-28 sm:pt-[calc(var(--spacing-header)+80px)]"
    >
      {/* --- רקע --- */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-20" aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1675376616537-c8aa9ddc9977?w=1920&q=80&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* כהות על גבי התמונה — שכבה אחת אחידה ועוד גרדיאנט כיווני, כדי
            שהטקסט הלבן יישאר קריא בכל אזור בלי להשחית לגמרי את התמונה. */}
        <div className="absolute inset-0 bg-brand-950/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/45 to-brand-950/60" />
        {/* שכבת עומק: שני זוהרים רדיאליים בעוצמות שונות */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(52% 60% at 78% 12%, rgba(255,193,7,0.18), transparent 62%)," +
              "radial-gradient(46% 54% at 12% 82%, rgba(74,135,214,0.32), transparent 65%)",
          }}
        />
        <div className="bg-grid absolute inset-0 opacity-[0.55]" />
        {/* דהייה לרקע העמוד — מונע קו חד בין ההירו לסקציה הבאה */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-50 to-transparent" />
      </motion.div>

      {/* --- אלמנטים צפים --- */}
      {!reduced && (
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          <div
            className="animate-float-slow absolute h-72 w-72 rounded-full bg-accent-400/10 blur-3xl"
            style={{ insetInlineEnd: "6%", top: "12%" }}
          />
          <div
            className="animate-float-slow absolute h-96 w-96 rounded-full bg-brand-400/14 blur-3xl"
            style={{ insetInlineStart: "-4%", bottom: "8%", animationDelay: "2.5s" }}
          />
          <FloatingChip className="hidden lg:flex" style={{ insetInlineEnd: "8%", top: "26%" }} delay={0.9}>
            <CategoryIcon name="Sparkles" className="h-4 w-4 text-accent-400" />
            מספרת נגה · 4.9
          </FloatingChip>
          <FloatingChip className="hidden xl:flex" style={{ insetInlineStart: "7%", top: "38%" }} delay={1.3}>
            <CategoryIcon name="Hammer" className="h-4 w-4 text-accent-400" />
            לוי שיפוצים · מאומת
          </FloatingChip>
        </div>
      )}

      {/* --- תוכן --- */}
      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* תג עליון */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-4 py-1.5 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"
                    style={{ animation: "pulse-ring 2.4s cubic-bezier(0,0,0.2,1) infinite" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
            </span>
            <span className="text-xs font-semibold text-white/85">
              מעודכן היום · 1,240 עסקים חדשים החודש
            </span>
          </motion.div>

          {/* כותרת */}
          <h1 className="mb-6 font-display text-4xl font-extrabold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
            {headline.map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: reduced ? 0 : 26, filter: reduced ? "none" : "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.7,
                  delay: reduced ? 0 : 0.12 + i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`inline-block ${word === "אחד" ? "text-gradient-gold" : ""}`}
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/72"
          >
            אלפי בעלי מקצוע מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר.
            מצאו בדיוק את מי שאתם צריכים — בלי לפתוח עשרים טאבים.
          </motion.p>

          {/* חיפוש */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 26, scale: reduced ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: reduced ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <SearchBar variant="hero" />
          </motion.div>

          {/* חיפושים חמים */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 0.85 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm"
          >
            <span className="text-white/50">חיפושים חמים:</span>
            {seedTrendingSearches.slice(0, 4).map((t) => (
              <Link
                key={t}
                href={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400/60 hover:bg-white/10 hover:text-white"
              >
                {t}
              </Link>
            ))}
          </motion.div>

          {/* נקודות אמון */}
          <motion.ul
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 1 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {TRUST_POINTS.map(({ Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 text-sm text-white/65">
                <Icon className="h-4.5 w-4.5 text-accent-400" strokeWidth={2.2} />
                {label}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* קיצורי קטגוריות */}
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          className="mt-14 flex gap-3 overflow-x-auto pb-2 no-scrollbar fade-edges-x sm:justify-center sm:flex-wrap sm:overflow-visible"
        >
          {seedCategories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group flex shrink-0 flex-col items-center gap-2.5 rounded-lg border border-white/12 bg-white/8 px-5 py-4 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-accent-400/45 hover:bg-white/14 sm:min-w-[128px]"
            >
              <span
                className="grid h-11 w-11 place-items-center rounded-sm transition-transform duration-300 group-hover:scale-110"
                style={{ background: `${cat.accentColor}26`, color: "#fff" }}
              >
                <CategoryIcon name={cat.icon} className="h-5 w-5" strokeWidth={2.1} />
              </span>
              <span className="whitespace-nowrap text-xs font-bold text-white/90">{cat.name}</span>
              <span className="text-2xs text-white/45">{cat.businessCount} עסקים</span>
            </Link>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function FloatingChip({
  children, className, style, delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`animate-float-slow absolute items-center gap-2 rounded-full border border-white/18 bg-white/10 px-4 py-2 text-xs font-semibold text-white/85 backdrop-blur-md ${className ?? ""}`}
      style={{ ...style, animationDelay: `${delay}s` }}
    >
      {children}
    </motion.div>
  );
}
