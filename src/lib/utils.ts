import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** מיזוג מחלקות Tailwind עם פתרון התנגשויות (px-2 + px-4 → px-4). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * עיצוב מספרים בעברית עם קיצור.
 * 1250 → "1.2K". משמש במוני הסטטיסטיקה ובספירת ביקורות.
 */
export function formatCompact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("he-IL").format(n);
}

/**
 * ספירה בעברית תקינה.
 *
 * "1 עסקים" הוא שגיאת דקדוק שקופצת לעין בכל כרטיס קטגוריה, ו-"0
 * עסקים" נכון אבל צורם. הפונקציה מטפלת בשלושת המקרים: אין, אחד,
 * ורבים.
 */
export function countLabel(
  n: number,
  forms: { none: string; one: string; many: string },
): string {
  if (n === 0) return forms.none;
  if (n === 1) return forms.one;
  return `${formatNumber(n)} ${forms.many}`;
}

/** "3 עסקים" / "עסק אחד" / "אין עדיין עסקים" */
export function businessCountLabel(n: number): string {
  return countLabel(n, { none: "אין עדיין חברות", one: "חברה אחת", many: "חברות" });
}

export function formatPrice(cents: number, currency = "ILS"): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * "לפני 3 ימים". Intl.RelativeTimeFormat נותן ניסוח עברי תקין,
 * כולל צורת היחיד/רבים — משהו שכל מימוש ידני מפספס.
 */
export function formatRelative(date: string | Date): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.round((then.getTime() - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("he", { numeric: "auto" });

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["week", 604_800],
    ["day", 86_400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [unit, sec] of units) {
    if (Math.abs(diffSec) >= sec) return rtf.format(Math.round(diffSec / sec), unit);
  }
  return rtf.format(diffSec, "second");
}

/**
 * פענוח פרמטר נתיב דינמי.
 *
 * בגרסת Next שבשימוש כאן, `params.slug` מגיע **מקודד** — עמוד עם
 * slug עברי מקבל "%D7%98%D7%9C..." ולא "טליסול". השוואה מול העמודה
 * במסד נכשלת בשקט, והעמוד מחזיר 404 למרות שהרשומה קיימת. זה השפיע
 * על כל עסק ששמו בעברית, כלומר כמעט על כולם.
 *
 * decodeURIComponent זורק על קלט פגום (למשל "%" בודד), ולכן במקרה
 * כזה מוחזרת המחרוזת המקורית — שתיכשל בחיפוש ותחזיר 404 אמיתי,
 * במקום להפיל את הבקשה ב-500.
 */
export function decodeParam(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

/** slug בטוח ל-URL ששומר על אותיות עבריות. תואם ל-slugify שב-DB. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * מספר טלפון ישראלי → פורמט E.164 עבור קישורי wa.me.
 *
 * הגרסה הקודמת החזירה כל מספר שמתחיל ב-972 כמו שהוא, ולכן מספר
 * שהוזן כ-"972054-9570-585" (קידומת בינלאומית **וגם** האפס המקומי)
 * יצר קישור לוואטסאפ שלא קיים. זה נראה תקין ברשימה ונשבר רק בלחיצה,
 * ולכן אף אחד לא שם לב.
 *
 * הסדר כאן חשוב: מקלפים קידומת יציאה, ואז 972, ואז את האפס המקומי —
 * ורק בסוף מרכיבים מחדש.
 */
export function toWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) digits = digits.slice(2);   // קידומת יציאה
  if (digits.startsWith("972")) digits = digits.slice(3);  // קידומת ישראל
  if (digits.startsWith("0")) digits = digits.slice(1);    // אפס מקומי

  return `972${digits}`;
}

/** דילוג על עבודה מיותרת בקלט חיפוש חי. */
export function debounce<A extends unknown[]>(fn: (...args: A) => void, ms = 250) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: A) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/**
 * בחירה משוקללת אקראית — לסבב הבאנרים.
 * באנר עם weight=3 ייבחר פי שלושה מבאנר עם weight=1.
 */
export function pickWeighted<T extends { weight: number }>(items: T[]): T | null {
  if (items.length === 0) return null;
  const total = items.reduce((sum, i) => sum + Math.max(1, i.weight), 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= Math.max(1, item.weight);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * סריאליזציה בטוחה של JSON-LD להטמעה בתוך תגית <script>.
 *
 * JSON.stringify לבדו **לא** מספיק כאן. הוא לא מברִיח `<` ולא `/`, ולכן
 * ערך תוכן שמכיל את הרצף `</script>` סוגר את התגית והדפדפן מתחיל לפרש
 * את מה שאחריו כ-HTML. ב-schema של עמוד עסק יושבים name, description
 * ו-tagline — כולם נערכים חופשית על ידי בעל העסק מהדשבורד — כלומר זה
 * היה נתיב XSS מאוחסן על מקור האתר עצמו, בעמוד ציבורי שגם מנהל גולש בו.
 *
 * ההברחה היא ל-\uXXXX ולא לישויות HTML: בתוך <script> הדפדפן לא מפענח
 * ישויות, אבל JSON כן מפענח \u — כך הפלט נשאר JSON תקין וקריא לגוגל.
 *
 * U+2028/U+2029 נכללים כי הם מפרידי שורה חוקיים ב-JavaScript אך לא
 * ב-JSON, ובלעדיהם אפשר לשבור את הסקריפט.
 */
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
