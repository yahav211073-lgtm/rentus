"use client";

import { motion, useReducedMotion } from "framer-motion";
import { SearchBar } from "@/components/search/SearchBar";
import type { Category } from "@/types/domain";
import type { SimpleCity } from "@/lib/repo/taxonomy";

/**
 * ההירו.
 *
 * תמונת רקע פוטוגרפית של ציוד להשכרה בגוון כחול כהה. הכותרת והחיפוש
 * ממורכזים מעל שכבת האפלה; הניסוח מבהיר כבר בשנייה הראשונה שזהו
 * מרקטפלייס להשכרות, ולא אינדקס שירותים כללי.
 */
export function Hero({
  categories, cities,
}: {
  categories: Category[];
  cities: SimpleCity[];
}) {
  const reduced = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden bg-brand-950 bg-cover bg-center pb-14 pt-[calc(var(--spacing-header)+40px)] sm:pb-16"
      style={{ backgroundImage: "url(/images/hero-stage.jpg)" }}
    >
      {/* שכבת האפלה — הכי כהה למטה, בגובה הטקסט, ובהירה יותר בקצוות
          כדי שהציוד בתמונה עדיין ייראה */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(5,12,28,0.94), rgba(5,12,28,0.72) 45%, rgba(5,12,28,0.55) 75%, rgba(5,12,28,0.62))",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 55% at 50% 38%, rgba(29,59,120,0.35), transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-4 font-display text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl lg:text-[2.75rem]"
          >
            כל מה שאפשר להשכיר, במקום אחד.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-8 text-base text-white/75 sm:text-lg"
          >
            מצאו עסקים להשכרת ציוד, רכב, חללים, כלי עבודה ועוד — בכל הארץ
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
          >
            <SearchBar variant="hero" categories={categories} cities={cities} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
