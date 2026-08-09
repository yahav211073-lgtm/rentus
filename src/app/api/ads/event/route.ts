import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { getVisitorHash } from "@/lib/visitor";

/**
 * קליטת אירועי פרסום (חשיפה / קליק / סגירה / המרה).
 *
 * הערות תכנון:
 *
 * · הכתיבה נעשית עם מפתח השירות בכוונה. RLS על ad_events חוסם
 *   כתיבה אנונימית — אחרת כל אחד היה יכול לנפח CTR של מתחרה.
 *   הנתיב הזה הוא השער היחיד, והוא מאמת את המבנה לפני הכתיבה.
 *
 * · התשובה תמיד 204, גם בכישלון. מדידה היא לא פונקציונליות
 *   שהמשתמש ביקש, ואסור לה להחזיר שגיאה שתופיע בקונסול או
 *   תשבור זרימה. הכישלונות נרשמים בצד השרת.
 *
 * · אין כאן כתובת IP ואין fingerprint — רק visitor_hash מעוגייה
 *   first-party. ראו את ההערה ב-src/lib/visitor.ts.
 */

const EventSchema = z.object({
  bannerId: z.string().uuid().optional(),
  popupId: z.string().uuid().optional(),
  type: z.enum(["impression", "click", "close", "conversion"]),
  path: z.string().max(512).optional(),
}).refine(
  (v) => Boolean(v.bannerId) !== Boolean(v.popupId),
  { message: "יש לספק בדיוק אחד מבין bannerId ו-popupId" },
);

export async function POST(request: Request) {
  try {
    const parsed = EventSchema.safeParse(await request.json());
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    const { bannerId, popupId, type, path } = parsed.data;

    const supabase = createSupabaseAdminClient();
    if (!supabase) return new NextResponse(null, { status: 204 });

    const visitorHash = await getVisitorHash();
    const ua = request.headers.get("user-agent") ?? "";
    const device = /Mobile|Android|iPhone/i.test(ua)
      ? "mobile"
      : /iPad|Tablet/i.test(ua) ? "tablet" : "desktop";

    const { error } = await supabase.from("ad_events").insert({
      banner_id: bannerId ?? null,
      popup_id: popupId ?? null,
      event_type: type,
      visitor_hash: visitorHash,
      path: path ?? null,
      device,
    });

    if (error) console.error("[ads/event] insert failed:", error.message);
  } catch (err) {
    console.error("[ads/event] unexpected:", err);
  }

  return new NextResponse(null, { status: 204 });
}
