"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus } from "lucide-react";
import { Section, SectionHeading } from "@/components/home/Section";
import { Reveal } from "@/components/motion/Reveal";
import type { FaqItem } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * שאלות נפוצות.
 *
 * אקורדיון עם פריט אחד פתוח בכל רגע. הפריט הראשון פתוח כברירת
 * מחדל — אקורדיון שכולו סגור נראה כמו רשימת כותרות ולא מזמין לחיצה.
 *
 * הנגישות כאן חשובה: כל כותרת היא <button> בתוך <h3>, עם
 * aria-expanded ו-aria-controls. גרסה עם <div> ו-onClick נראית
 * זהה ולא קיימת בשביל קורא מסך.
 *
 * ה-JSON-LD מסוג FAQPage נבנה מאותם נתונים בעמוד עצמו.
 */
export function FaqSection({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const reduced = useReducedMotion();

  return (
    <Section id="faq" className="bg-ink-50">
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading
            eyebrow="שאלות נפוצות"
            title="כל מה שרציתם לדעת"
            subtitle="ואם לא מצאתם תשובה — הצוות שלנו זמין בצ׳אט ובטלפון בימים א׳–ה׳, 9:00–18:00."
            className="mb-0"
          />
        </div>

        <Reveal direction="end">
          <ul className="space-y-3">
            {items.map((item) => {
              const isOpen = openId === item.id;
              return (
                <li
                  key={item.id}
                  className={cn(
                    "overflow-hidden rounded-lg border bg-white transition-all duration-300",
                    isOpen
                      ? "border-brand-200 shadow-[0_14px_36px_-14px_rgba(11,59,117,0.22)]"
                      : "border-ink-200/70 hover:border-brand-200",
                  )}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      id={`faq-button-${item.id}`}
                      className="flex w-full items-center justify-between gap-4 p-5 text-start"
                    >
                      <span className={cn(
                        "text-base font-bold transition-colors sm:text-md",
                        isOpen ? "text-brand-800" : "text-ink-800",
                      )}>
                        {item.question}
                      </span>
                      <span className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-all duration-300",
                        isOpen
                          ? "rotate-[135deg] bg-brand-800 text-white"
                          : "bg-ink-100 text-ink-500",
                      )}>
                        <Plus className="h-4 w-4" strokeWidth={2.5} />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-panel-${item.id}`}
                        role="region"
                        aria-labelledby={`faq-button-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                          duration: reduced ? 0.01 : 0.35,
                          ease: [0.22, 1, 0.36, 1],
                          opacity: { duration: reduced ? 0.01 : 0.22 },
                        }}
                        className="overflow-hidden"
                      >
                        <p className="px-5 pb-5 text-base leading-relaxed text-ink-500">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
