import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * ביקורת על הפלטפורמה עצמה.
 *
 * אותו חוזה כמו ביקורת על עסק: חשבון מחובר, status='pending' תמיד,
 * ומופיעה בעמוד הבית רק אחרי אישור ב-/admin/testimonials.
 */
const Schema = z.object({
  rating: z.number().int().min(1).max(5),
  quote: z.string().min(10, "כתבו לפחות כמה מילים").max(1000),
  authorName: z.string().min(2, "שם קצר מדי").max(80),
  authorRole: z.string().max(80).optional(),
  company: z.string().max(0).optional(), // דבש
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

  if (!isSupabaseConfigured) {
    return NextResponse.json({ error: "השירות אינו זמין כרגע." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: auth } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const user = auth?.user;

  if (!user) {
    return NextResponse.json(
      { error: "כדי לכתוב ביקורת על האתר צריך להתחבר לחשבון." },
      { status: 401 },
    );
  }

  if (!(await checkRateLimit(`site-review:${user.id}`, { max: 3, windowMinutes: 1440 }))) {
    return NextResponse.json({ error: "כבר שלחתם ביקורת לאחרונה." }, { status: 429 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return NextResponse.json({ error: "השירות אינו זמין כרגע." }, { status: 503 });

  const { rating, quote, authorName, authorRole } = parsed.data;

  const { error } = await admin.from("testimonials").insert({
    user_id: user.id,
    author_name: authorName,
    author_role: authorRole || null,
    quote,
    rating,
    status: "pending",
    is_active: true,
  });

  if (error) {
    // העמודה status נוספת ב-0015. אם המיגרציה טרם הורצה, עדיף
    // להחזיר שגיאה מפורשת מאשר לשמור ביקורת שתתפרסם בלי אישור.
    return NextResponse.json(
      { error: "שמירת הביקורת נכשלה. נסו שוב מאוחר יותר." },
      { status: 500 },
    );
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
