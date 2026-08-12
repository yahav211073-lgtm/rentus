import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * קליטת ביקורת. אותו דפוס בדיוק כמו api/leads: דבש, ולידציה, הגבלת
 * קצב לפי מבקר ולפי עסק, admin client.
 *
 * status='pending' תמיד — reviews_create ב-0009_rls.sql אוכף את זה
 * גם ברמת ה-DB (with check), אז גם אם מישהו ידלג על הראוט הזה
 * ויכתוב ישירות מול הלקוח, לא ניתן לפרסם ביקורת מאושרת מהצד.
 */

const Schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  authorName: z.string().min(2, "שם קצר מדי").max(80),
  authorEmail: z.string().email().max(254).optional(),
  company: z.string().max(0).optional(), // שדה דבש
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" },
      { status: 400 },
    );
  }

  const { businessId, rating, title, body: reviewBody, authorName, authorEmail } = parsed.data;

  const visitor = await getVisitorHash();
  const [visitorOk, businessOk] = await Promise.all([
    checkRateLimit(`review:v:${visitor}`, { max: 5, windowMinutes: 60 }),
    checkRateLimit(`review:b:${businessId}`, { max: 30, windowMinutes: 60 }),
  ]);

  if (!visitorOk || !businessOk) {
    return NextResponse.json({ error: "יותר מדי ביקורות. נסו שוב מאוחר יותר." }, { status: 429 });
  }

  if (!isSupabaseConfigured) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע" }, { status: 503 });
  }

  const { error } = await supabase.from("reviews").insert({
    business_id: businessId,
    rating,
    title: title ?? null,
    body: reviewBody ?? null,
    author_name: authorName,
    author_email: authorEmail ?? null,
    status: "pending",
  });

  if (error) {
    console.error("[reviews] insert failed:", error.message);
    return NextResponse.json({ error: "משהו השתבש. נסו שוב." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
