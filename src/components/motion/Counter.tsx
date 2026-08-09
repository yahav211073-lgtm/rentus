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
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // כשהתנועה מושבתת אין כאן שום עבודה — הערך הסופי מוצג ישירות
    // ברינדור (ראו shown למטה), בלי setState ובלי רינדור נוסף.
    if (!inView || reduced) return;

    let frame = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, duration, reduced]);

  // במצב תנועה מופחתת מדלגים על הספירה ומציגים את הערך הסופי
  const shown = reduced && inView ? value : display;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {prefix}
      {formatNumber(shown)}
      {suffix}
    </span>
  );
}
