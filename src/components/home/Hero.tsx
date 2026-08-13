"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, BadgeCheck, ShieldCheck, TrendingUp } from "lucide-react";
import { SearchBar } from "@/components/search/SearchBar";
import { seedTrendingSearches } from "@/data/seed";
import type { Category } from "@/types/domain";
import type { SimpleCity } from "@/lib/repo/taxonomy";

/**
 * ההירו.
 *
 * קומפקטי בכוונה: החיפוש חייב להיות בתוך הקיפול הראשון בלי גלילה.
 * רצועה שטוחה בצבע המותג (לא תמונת רקע) + כרטיס קידום צדדי, בהשראת
 * הדף שהמשתמש סימן כרפרנס.
 */

const TRUST_POINTS = [
  { Icon: BadgeCheck, label: "14,200 עסקים מאומתים" },
  { Icon: ShieldCheck, label: "ביקורות מאומתות בלבד" },
  { Icon: TrendingUp, label: "38,000 פניות בחודש" },
];

export function Hero({
  categories, cities, brandName,
}: {
  categories: Category[];
  cities: SimpleCity[];
  brandName: string;
}) {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-brand-900 to-brand-700 pb-10 pt-[calc(var(--spacing-header)+28px)] sm:pb-14">
      <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 55% at 82% 8%, rgba(255,193,7,0.16), transparent 60%)," +
            "radial-gradient(40% 50% at 10% 90%, rgba(74,135,214,0.28), transparent 65%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_300px]">
          {/* --- תוכן ראשי --- */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/18 bg-white/8 px-3.5 py-1.5 backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75"
                  style={{ animation: "pulse-ring 2.4s cubic-bezier(0,0,0.2,1) infinite" }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
              </span>
              <span className="text-xs font-semibold text-white/85">
                מעודכן היום · 1,240 עסקים חדשים החודש
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: reduced ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mb-6 font-display text-3xl font-extrabold leading-[1.12] text-white sm:text-4xl lg:text-[2.75rem]"
            >
              {brandName} — <span className="text-gradient-gold">כל מה שמשכירים, במקום אחד</span>
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: reduced ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
            >
              <SearchBar variant="hero" categories={categories} cities={cities} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-4 flex flex-wrap items-center gap-2 text-sm"
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

            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-2.5"
            >
              {TRUST_POINTS.map(({ Icon, label }) => (
                <li key={label} className="inline-flex items-center gap-2 text-sm text-white/65">
                  <Icon className="h-4.5 w-4.5 text-accent-400" strokeWidth={2.2} />
                  {label}
                </li>
              ))}
            </motion.ul>
          </div>

          {/* --- כרטיס קידום צדדי --- */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <Link
              href="/business/register"
              className="group block rounded-lg bg-gradient-to-br from-accent-400 to-accent-500 p-5 shadow-[0_20px_45px_-14px_rgba(0,0,0,0.5)] transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="mb-3 grid h-11 w-11 place-items-center rounded-sm bg-brand-950/15">
                <TrendingUp className="h-5.5 w-5.5 text-brand-950" strokeWidth={2.2} />
              </span>
              <p className="mb-1.5 font-display text-lg font-extrabold leading-tight text-brand-950">
                בעל עסק להשכרה?
              </p>
              <p className="mb-4 text-sm leading-relaxed text-brand-950/75">
                רישום פרופיל בסיסי חינם — הלקוחות כבר מחפשים אתכם.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-950">
                לפרטים
                <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
