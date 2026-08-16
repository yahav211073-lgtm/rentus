import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getVisitorHash } from "@/lib/visitor";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * קליטת ביקורת על עסק.
 *
 * ביקורת דורשת חשבון. זו החלטת מוצר, והיא נאכפת בשלוש שכבות:
 * הטופס לא מוצג לאורח, הראוט הזה דוחה בקשה בלי סשן, ומדיניות
 * reviews_create ב-0015 מחייבת user_id = auth.uid(). שכבה אחת בלבד
 * הייתה נשברת ברגע שמישהו קורא ל-API ישירות.
 *
 * status='pending' תמיד, ולא ניתן לשלוח 'approved' מהצד — גם כאן
 * ה-with check ב-DB הוא ההגנה האמיתית, לא הקוד.
 */

const Schema = z.object({
  businessId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().max(2000).optional(),
  authorName: z.string().min(2, "שם קצר מדי").max(80),
  company: z.string().max(0).optional(), // שדה דבש
});

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  const parsed = Schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "פרטים לא תקינים" },
      { status: 400 },
    );
  }

  const { businessId, rating, title, body: reviewBody, authorName } = parsed.data;

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = auth?.user;

  if (!user) {
    return NextResponse.json(
      { error: "כדי לכתוב ביקורת צריך להתחבר לחשבון." },
      { status: 401 },
    );
  }

  const visitor = await getVisitorHash();
  const [visitorOk, businessOk] = await Promise.all([
    checkRateLimit(`review:u:${user.id}`, { max: 5, windowMinutes: 60 }),
    checkRateLimit(`review:b:${businessId}`, { max: 30, windowMinutes: 60 }),
  ]);

  if (!visitorOk || !businessOk) {
    return NextResponse.json({ error: "יותר מדי ביקורות. נסו שוב מאוחר יותר." }, { status: 429 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע." }, { status: 503 });
  }

  // ביקורת אחת לכל משתמש לכל עסק — אחרת אפשר להזיז דירוג של עסק
  // בלחיצות חוזרות מאותו חשבון.
  const { data: existing } = await admin
    .from("reviews")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "כבר כתבתם ביקורת על העסק הזה." }, { status: 409 });
  }

  const { error } = await admin.from("reviews").insert({
    business_id: businessId,
    user_id: user.id,
    author_name: authorName,
    author_email: user.email ?? null,
    rating,
    title: title || null,
    body: reviewBody || null,
    status: "pending",
    ip_hash: visitor,
  });

  if (error) {
    return NextResponse.json({ error: "שמירת הביקורת נכשלה. נסו שוב." }, { status: 500 });
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
