"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * האם האלמנט כבר נמצא מעל אזור התצוגה בטעינה.
 *
 * זה מטפל בבאג אמיתי ולא תיאורטי: whileInView נשען על
 * IntersectionObserver, ואלמנט שכבר גלול מעל החלון לעולם לא יחתוך
 * אותו — ולכן יישאר ב-opacity 0 לנצח.
 *
 * זה קורה בכל אחד מהמקרים האלה:
 *   · הדפדפן משחזר מיקום גלילה ברענון או בחזרה אחורה
 *   · כניסה לקישור עוגן (‎/#faq‎)
 *   · שחזור מיקום אחרי ניווט צד-לקוח
 *
 * במקרים כאלה מוותרים על האנימציה ומציגים מיד. אנימציה שהמשתמש
 * ממילא לא יראה לא שווה סיכון של תוכן בלתי נראה.
 */
/*
 * מיושם כ-callback ref ולא כ-RefObject: ה-ref מחובר לאלמנט motion
 * שהתגית שלו משתנה (div / li / section), ו-RefObject מטיפוס אחד
 * לא מתיישב עם איחוד התגיות. פונקציה שמקבלת HTMLElement מתאימה לכולן.
 */
function useAlreadyScrolledPast() {
  const [passed, setPassed] = useState(false);

  const measureRef = useCallback((el: HTMLElement | null) => {
    if (el && el.getBoundingClientRect().bottom < 0) setPassed(true);
  }, []);

  return [passed, measureRef] as const;
}

/**
 * חשיפה בגלילה.
 *
 * שלושה דברים שהופכים את זה מ"אנימציה" ל"אנימציה טובה":
 *
 * 1. once: true — האלמנט מונפש פעם אחת. אלמנט שקופץ מחדש בכל גלילה
 *    למעלה ולמטה הוא מטרד, לא פוליש.
 *
 * 2. margin שלילי בתחתית — האנימציה מתחילה כשהאלמנט 12% בתוך המסך,
 *    לא ברגע שהפיקסל הראשון שלו נוגע בקצה. אחרת המשתמש מפספס אותה.
 *
 * 3. useReducedMotion — כשהמשתמש ביקש פחות תנועה, אין תזוזה בכלל.
 *    לא "תנועה קטנה יותר". אפס.
 */

type Direction = "up" | "down" | "start" | "end" | "none";

const OFFSET: Record<Direction, { x: number; y: number }> = {
  up:    { x: 0,  y: 26 },
  down:  { x: 0,  y: -26 },
  // start/end ב-RTL: start = ימין, ולכן ההיסט חיובי בציר X
  start: { x: 30, y: 0 },
  end:   { x: -30, y: 0 },
  none:  { x: 0,  y: 0 },
};

interface RevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  className?: string;
  /** מגדיל מעט בכניסה — לכרטיסים ותמונות */
  scale?: boolean;
  as?: "div" | "section" | "li" | "article" | "header";
}

export function Reveal({
  children, direction = "up", delay = 0, duration = 0.65,
  className, scale = false, as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const [passed, measureRef] = useAlreadyScrolledPast();
  const { x, y } = reduced ? OFFSET.none : OFFSET[direction];
  const MotionTag = motion[as];

  const shown = { opacity: 1, x: 0, y: 0, scale: 1 };

  return (
    <MotionTag
      ref={measureRef}
      className={className}
      initial={{ opacity: 0, x, y, scale: scale && !reduced ? 0.97 : 1 }}
      // כשהאלמנט כבר מעל החלון — מדלגים על whileInView ומציגים ישירות
      {...(passed ? { animate: shown } : { whileInView: shown })}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{
        duration: reduced || passed ? 0.01 : duration,
        delay: reduced || passed ? 0 : delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </MotionTag>
  );
}

/**
 * מיכל שמדרג את הילדים שלו — כל ילד נכנס מעט אחרי קודמו.
 * זה מה שגורם לרשת כרטיסים להיראות כמו רצף ולא כמו הבזק אחד.
 */
export function RevealStagger({
  children, className, stagger = 0.07, delay = 0, as = "div",
}: {
  children: ReactNode; className?: string; stagger?: number; delay?: number;
  as?: "div" | "ul" | "section";
}) {
  const reduced = useReducedMotion();
  const [passed, measureRef] = useAlreadyScrolledPast();
  const MotionTag = motion[as];

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduced || passed ? 0 : stagger,
        delayChildren: reduced || passed ? 0 : delay,
      },
    },
  };

  return (
    <MotionTag
      ref={measureRef}
      className={className}
      variants={container}
      initial="hidden"
      {...(passed ? { animate: "show" } : { whileInView: "show" })}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </MotionTag>
  );
}

/** פריט בתוך RevealStagger. חייב להיות צאצא ישיר שלו. */
export function RevealItem({
  children, className, as = "div",
}: { children: ReactNode; className?: string; as?: "div" | "li" | "article" }) {
  const reduced = useReducedMotion();
  const MotionTag = motion[as];

  const item: Variants = {
    hidden: { opacity: 0, y: reduced ? 0 : 22 },
    show: {
      opacity: 1, y: 0,
      transition: { duration: reduced ? 0.01 : 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  return <MotionTag className={cn(className)} variants={item}>{children}</MotionTag>;
}
