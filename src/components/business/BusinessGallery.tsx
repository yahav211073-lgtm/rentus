"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { MediaItem } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useModalLock } from "@/lib/hooks/modal";

/**
 * גלריית התמונות של העסק + לייטבוקס.
 *
 * שלוש החלטות:
 *
 * 1. הרשת אינה ריבועית אחידה. התמונה הראשונה תופסת שתי משבצות —
 *    כך שגלריה של חמש תמונות נראית ערוכה ולא כמו טבלת קבצים.
 *
 * 2. הלייטבוקס נועל גלילה, נסגר ב-Escape ומנווט בחיצים. ב-RTL
 *    החץ השמאלי מתקדם קדימה, כי זה הכיוון שאליו העין נעה.
 *
 * 3. אין תמונת "ממלא מקום". כשאין מדיה הרכיב לא מרונדר בכלל, והעמוד
 *    פשוט לא מציג סקציית גלריה — ראו business/[slug]/page.tsx.
 */
export function BusinessGallery({
  images, businessName,
}: { images: MediaItem[]; businessName: string }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  const reduced = useReducedMotion();
  const isOpen = openAt !== null;
  useModalLock(isOpen);

  const go = useCallback(
    (delta: number) => {
      setOpenAt((current) =>
        current === null ? null : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenAt(null);
      // ב-RTL: ArrowLeft = הבא, ArrowRight = הקודם
      if (e.key === "ArrowLeft") go(1);
      if (e.key === "ArrowRight") go(-1);
    };

    /* נעילת הגלילה עברה ל-useModalLock למעלה — שני מקומות שכותבים
       ל-body.style.overflow דורסים זה את זה כשמודאל אחד נסגר בזמן
       שהשני עדיין פתוח. */
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, go]);

  if (images.length === 0) return null;

  const active = openAt !== null ? images[openAt] : null;

  return (
    <>
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {images.slice(0, 8).map((image, index) => (
          <li
            key={image.id}
            className={cn(
              "relative overflow-hidden rounded-md bg-ink-100",
              index === 0 && "col-span-2 row-span-2",
            )}
          >
            <button
              type="button"
              onClick={() => setOpenAt(index)}
              aria-label={`הגדלת תמונה ${index + 1} מתוך ${images.length}`}
              className="group block aspect-4/3 w-full cursor-zoom-in"
            >
              <Image
                src={image.url}
                alt={image.alt || `תמונה מהגלריה של ${businessName}`}
                fill
                sizes={index === 0 ? "(max-width: 640px) 100vw, 460px" : "(max-width: 640px) 50vw, 230px"}
                className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
              />
              {/* המשבצת האחרונה מציגה כמה עוד נשארו, במקום לחתוך בשקט */}
              {index === 7 && images.length > 8 && (
                <span className="absolute inset-0 grid place-items-center bg-brand-950/65 font-display text-xl font-extrabold text-white">
                  +{images.length - 8}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {active && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`גלריית התמונות של ${businessName}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            /* z-[86]: לייטבוקס במסך מלא חייב לכסות גם את סרגל הניווט
               התחתון (z-70) ואת סרגל הפעולה של העסק (z-71). */
            className="fixed inset-0 z-[86] flex flex-col bg-brand-950/94 backdrop-blur-sm"
            onClick={() => setOpenAt(null)}
          >
            <div className="flex items-center justify-between p-4 text-white">
              <span className="text-sm tabular-nums text-white/70">
                {(openAt ?? 0) + 1} / {images.length}
              </span>
              <button
                type="button"
                onClick={() => setOpenAt(null)}
                aria-label="סגירת הגלריה"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative flex flex-1 items-center justify-center px-4 pb-6">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="relative h-full w-full max-w-5xl"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={active.url}
                  alt={active.alt || `תמונה מהגלריה של ${businessName}`}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </motion.div>

              {images.length > 1 && (
                <>
                  <GalleryNav side="start" onClick={() => go(-1)} label="התמונה הקודמת">
                    <ChevronRight className="h-6 w-6" aria-hidden="true" />
                  </GalleryNav>
                  <GalleryNav side="end" onClick={() => go(1)} label="התמונה הבאה">
                    <ChevronLeft className="h-6 w-6" aria-hidden="true" />
                  </GalleryNav>
                </>
              )}
            </div>

            {active.caption && (
              <p className="px-4 pb-6 text-center text-sm text-white/70">{active.caption}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function GalleryNav({
  side, onClick, label, children,
}: { side: "start" | "end"; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="absolute top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white backdrop-blur transition-colors hover:bg-white/25"
      style={side === "start" ? { insetInlineStart: 12 } : { insetInlineEnd: 12 }}
    >
      {children}
    </button>
  );
}
