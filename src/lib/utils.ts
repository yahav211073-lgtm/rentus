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

/** slug בטוח ל-URL ששומר על אותיות עבריות. תואם ל-slugify שב-DB. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "");
}

/** מספר טלפון ישראלי → פורמט E.164 עבור קישורי wa.me */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("972")) return digits;
  if (digits.startsWith("0")) return `972${digits.slice(1)}`;
  return digits;
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
