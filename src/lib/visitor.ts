import { cookies } from "next/headers";

/**
 * מזהה מבקר אנונימי.
 *
 * מה זה כן: ערך אקראי שנוצר פעם אחת ונשמר בעוגייה first-party.
 * הוא מאפשר לספור "כמה אנשים" במקום "כמה טעינות עמוד", ולכבד
 * הגבלת תדירות של פופאפים.
 *
 * מה זה לא: לא fingerprint, לא כתובת IP, ולא מקושר לזהות.
 * הגולש יכול לאפס אותו בניקוי עוגיות, וזו בדיוק הכוונה.
 *
 * SameSite=Lax ו-httpOnly — הערך לא נחוץ ל-JavaScript בדפדפן,
 * ולכן אין סיבה לחשוף אותו לסקריפטים.
 */

const COOKIE = "index_vid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export async function getVisitorHash(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing) return existing;

  const fresh = crypto.randomUUID();

  try {
    store.set(COOKIE, fresh, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: ONE_YEAR,
      path: "/",
    });
  } catch {
    // נקרא מהקשר שאסור לו לכתוב עוגיות — מחזירים ערך חד-פעמי
  }

  return fresh;
}
