/**
 * מה הופך עסק ל"מאומת".
 *
 * ההגדרה יושבת כאן ולא בקובץ ה-actions כי היא נחוצה גם לתצוגה (מה
 * חסר לעסק ברשימת הניהול) וגם לאכיפה (סירוב לסמן עסק חלקי), ומודול
 * "use server" יכול לייצא פונקציות אסינכרוניות בלבד.
 *
 * ההגדרה עצמה: המנהל הזין ידנית את כל הפרטים המהותיים. לא בדיקה
 * אוטומטית של בעלות — תג אמון שנשען על שלמות שדות ותו לא.
 */
/** השדות שבלעדיהם עסק אינו נחשב מאומת. משותף לפעולה ולתצוגת החוסרים. */
export function missingVerificationFields(b: {
  logo_url?: string | null;
  phone?: string | null;
  address?: string | null;
  city_id?: string | null;
  business_hours?: unknown[] | null;
  business_service_areas?: unknown[] | null;
} | null): string[] {
  if (!b) return ["העסק לא נמצא"];
  const missing: string[] = [];
  if (!b.logo_url) missing.push("לוגו");
  if (!b.phone) missing.push("טלפון");
  if (!b.address) missing.push("כתובת");
  if (!b.city_id) missing.push("עיר");
  if (!b.business_hours?.length) missing.push("שעות פעילות");
  if (!b.business_service_areas?.length) missing.push("אזורי שירות");
  return missing;
}
