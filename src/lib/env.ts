/**
 * גישה מרוכזת למשתני סביבה.
 *
 * הפלטפורמה רצה גם בלי Supabase מוגדר — במצב הזה שכבת הנתונים
 * נופלת לתוכן ההדגמה שב-src/data/seed.ts. זה מכוון: מפתח חדש
 * צריך `npm run dev` ואתר עובד, בלי להתחיל מהקמת מסד נתונים.
 *
 * בפרודקשן isSupabaseConfigured חייב להיות true — יש בדיקה על כך
 * ב-src/lib/repo/index.ts שזורקת שגיאה אם רצים בפרודקשן בלי חיבור.
 */

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  /** מפתח שירות — שרת בלבד. לעולם לא מיוצא לרכיב לקוח. */
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  siteName: process.env.NEXT_PUBLIC_SITE_NAME ?? "אינדקס",
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);

export const isProduction = process.env.NODE_ENV === "production";
