import type { AdTargeting } from "@/types/domain";

/**
 * הערכת כללי מיקוד.
 *
 * הפונקציה הזו היא נקודת ההכרעה היחידה של מערכת הפרסום — גם באנרים
 * וגם פופאפים עוברים דרכה. היא נשארת פונקציה טהורה (בלי גישה ל-DOM
 * ובלי fetch) כדי שאפשר יהיה להריץ אותה גם בשרת, גם בלקוח, וגם בטסטים.
 *
 * הכלל הבסיסי: שדה ריק = ללא הגבלה. מנהל שלא בחר ערים מתכוון
 * "בכל הארץ", לא "בשום עיר".
 */

export type Device = "desktop" | "tablet" | "mobile";

export interface AdContext {
  path: string;
  device: Device;
  isLoggedIn: boolean;
  isBusinessOwner: boolean;
  categorySlugs?: string[];
  citySlug?: string;
  now?: Date;
}

export interface ScheduleWindow {
  startsAt?: string | null;
  endsAt?: string | null;
  activeHours?: number[];
  activeDays?: number[];
}

/**
 * התאמת נתיב.
 * תומך בתו כללי בסוף בלבד ('/search*'), במכוון — תבניות glob מלאות
 * מזמינות טעויות שמפילות קמפיין שלם, וכמעט אף פעם לא נחוצות.
 */
function pathMatches(pattern: string, path: string): boolean {
  if (pattern.endsWith("*")) return path.startsWith(pattern.slice(0, -1));
  return pattern === path;
}

export function matchesTargeting(t: AdTargeting | null | undefined, ctx: AdContext): boolean {
  if (!t) return true;

  // נתיבים מוחרגים גוברים על הכל
  if (t.excludePaths?.length && t.excludePaths.some((p) => pathMatches(p, ctx.path))) {
    return false;
  }

  if (t.paths?.length && !t.paths.some((p) => pathMatches(p, ctx.path))) {
    return false;
  }

  if (t.devices?.length && !t.devices.includes(ctx.device)) {
    return false;
  }

  if (t.audience && t.audience !== "all") {
    if (t.audience === "guests" && ctx.isLoggedIn) return false;
    if (t.audience === "logged_in" && !ctx.isLoggedIn) return false;
    if (t.audience === "business_owners" && !ctx.isBusinessOwner) return false;
  }

  if (t.cities?.length) {
    if (!ctx.citySlug || !t.cities.includes(ctx.citySlug)) return false;
  }

  if (t.categories?.length) {
    const cats = ctx.categorySlugs ?? [];
    if (!t.categories.some((c) => cats.includes(c))) return false;
  }

  return true;
}

/**
 * האם הקמפיין בחלון הזמן שלו.
 * מופרד ממיקוד הקהל בכוונה: "למה הבאנר לא מוצג" מתחלק כמעט תמיד
 * ל"לא מתאים לקהל" או "לא בזמן", ושתי הפונקציות נותנות תשובה נפרדת.
 */
export function isWithinSchedule(w: ScheduleWindow, now = new Date()): boolean {
  if (w.startsAt && now < new Date(w.startsAt)) return false;
  if (w.endsAt && now > new Date(w.endsAt)) return false;

  if (w.activeDays?.length && !w.activeDays.includes(now.getDay())) return false;
  if (w.activeHours?.length && !w.activeHours.includes(now.getHours())) return false;

  return true;
}

/** זיהוי סוג מכשיר לפי רוחב. נקודות השבירה תואמות ל-Tailwind. */
export function detectDevice(width: number): Device {
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}
