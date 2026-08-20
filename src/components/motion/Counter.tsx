"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { cn, formatNumber } from "@/lib/utils";

/**
 * מונה מונפש.
 *
 * העקומה היא easeOutExpo ולא ליניארית: המספר מזנק מהר ואז מתמתן
 * לקראת הערך הסופי. ספירה ליניארית מרגישה כמו טיימר; זו מרגישה
 * כמו נתון שמתייצב.
 *
 * הספירה מתחילה רק כשהאלמנט נראה, ורצה פעם אחת.
 * requestAnimationFrame ולא setInterval — משתלב עם קצב הרענון
 * של המסך ולא נתקע ב-60fps מדומה.
 */

interface CounterProps {
  value: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function Counter({ value, duration = 2000, suffix = "", prefix = "", className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();

  /**
   * null = "לא סופרים כרגע", ואז מוצג הערך האמיתי.
   *
   * זה ההפך מלהתחיל מ-0, וזו הנקודה החשובה כאן: קודם ה-state התחיל
   * ב-0, כלומר גם ה-HTML מהשרת אמר "0 חברות רשומות". מי שראה את זה
   * הוא בדיוק מי שאסור שיראה את זה — סורק של גוגל, גולש בלי JS,
   * וכל מצב שבו requestAnimationFrame לא רץ (לשונית ברקע נחנקת,
   * ואז המספר פשוט נתקע על אפס). רצועה שמכריזה על אתר ריק גרועה
   * מרצועה בלי אנימציה.
   */
  const [display, setDisplay] = useState<number | null>(null);

  /**
   * סופרים רק אם האלמנט התחיל מחוץ למסך.
   *
   * אם הוא כבר נראה בטעינה, המשתמש כבר קרא את המספר האמיתי — קפיצה
   * אחורה ל-0 וספירה משם היא תיקון של מה שלא היה שבור. ההחלטה
   * ברירת המחדל היא false — לא לספור. אם המדידה לא רצה מסיבה כלשהי,
   * המצב הבטוח הוא להציג את המספר האמיתי בלי אנימציה, ולא להפך.
   * ה-effect שמודד מוצהר לפני זה שמפעיל, ולכן הוא רץ לפניו.
   */
  const startedOffscreen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    startedOffscreen.current = r.top > window.innerHeight;
  }, []);

  useEffect(() => {
    if (!inView || reduced || !startedOffscreen.current) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo — זינוק מהיר והתמתנות. ליניארי מרגיש כמו טיימר.
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
      else setDisplay(null); // חזרה למקור האמת אחרי שהאנימציה נגמרה
    };

    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      setDisplay(null);
    };
  }, [inView, value, duration, reduced]);

  const shown = display ?? value;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(shown)}
      {suffix}
    </span>
  );
}
