import { createSupabaseAdminClient } from "@/lib/supabase/server";

/**
 * הגבלת קצב.
 *
 * המימוש הוא חלון קבוע (fixed window) ולא חלון מתגלגל, ובכוונה:
 * חלון מתגלגל מדויק דורש מבנה נתונים שמחזיק חותמת לכל בקשה, ובקנה
 * המידה כאן זה עלות שלא מחזירה את עצמה. החיסרון המוכר של חלון קבוע —
 * אפשר לשלוח 2× מהמכסה סביב גבול החלון — מקובל לחלוטין עבור טפסים
 * ציבוריים.
 *
 * המצב נשמר ב-DB ולא בזיכרון, כי Next.js על serverless לא מחזיק
 * מצב בין קריאות: מונה בזיכרון פשוט לא יעבוד שם.
 *
 * ברירת המחדל כשאין מסד נתונים היא "לאפשר". חוסם שנופל ומפיל איתו
 * את כל הטפסים באתר גרוע מחוסר חסימה בסביבת פיתוח.
 */

interface Options {
  /** מספר הבקשות המותר בחלון */
  max: number;
  /** אורך החלון בדקות */
  windowMinutes: number;
}

export async function checkRateLimit(bucket: string, opts: Options): Promise<boolean> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) return true;

  const windowMs = opts.windowMinutes * 60_000;
  const windowStart = new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString();

  try {
    const { data, error } = await supabase
      .from("rate_limits")
      .select("count")
      .eq("bucket", bucket)
      .eq("window_start", windowStart)
      .maybeSingle();

    if (error) {
      console.error("[rate-limit] read failed:", error.message);
      return true;
    }

    const current = data?.count ?? 0;
    if (current >= opts.max) return false;

    await supabase
      .from("rate_limits")
      .upsert(
        { bucket, window_start: windowStart, count: current + 1 },
        { onConflict: "bucket,window_start" },
      );

    return true;
  } catch (err) {
    console.error("[rate-limit] unexpected:", err);
    return true;
  }
}
