"use client";

import Image from "next/image";
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
  categories, cities, imageUrl,
}: {
  categories: Category[];
  cities: SimpleCity[];
  imageUrl: string;
}) {
  const reduced = useReducedMotion();

  return (
    <section className="relative isolate h-[310px] overflow-hidden bg-brand-950">
      {/* priority + fetchPriority: זו התמונה הראשונה שנטענת בעמוד הבית
          (LCP), ולכן היא היחידה באתר שלא נטענת lazy. */}
      <Image
        src={imageUrl}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />

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

      <div className="relative mx-auto max-w-[1480px] px-4 pt-[48px] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[840px] text-center">
          <motion.h1
            initial={{ opacity: 0, y: reduced ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            className="mb-2 font-display text-3xl font-extrabold leading-[1.15] text-white sm:text-4xl lg:text-[2.35rem]"
          >
            מחפשים ציוד? המקום הנכון.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: reduced ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mb-6 text-base text-white/80 sm:text-lg"
          >
            השוו מחירים, קבלו הצעות ובחרו את החברה המתאימה לכם
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
