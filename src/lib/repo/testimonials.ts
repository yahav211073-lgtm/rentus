import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Testimonial } from "@/types/domain";

/**
 * ביקורות על הפלטפורמה עצמה (להבדיל מביקורות על עסק בודד).
 *
 * שולפת רק status='approved' וגם is_active. שני התנאים אמיתיים
 * ונפרדים: status הוא תוצאת המודרציה, is_active הוא "הסתר זמנית"
 * של מנהל. ה-RLS ב-0015 אוכף את אותה בדיקה בדיוק ברמת המסד, כך
 * שגם קריאה שעוקפת את הפונקציה הזו לא תחשוף ביקורת שלא אושרה.
 *
 * אין כאן תוכן ברירת מחדל. ביקורת בדויה בשם אדם שלא קיים היא הדבר
 * שהופך "המלצות" לחסרות ערך — עדיף מצב ריק כן.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;

/* התגית בכרטיס הביקורת נגזרת מהקטגוריה הראשית של העסק שהביקורת
   מקושרת אליו, ולא מעמודה חדשה. הקישור כבר קיים (testimonials.business_id),
   ועמודה כפולה הייתה מאפשרת לתגית לסתור את הקטגוריה האמיתית של העסק. */
function primaryCategoryName(row: Row): string | null {
  const links = row?.business?.business_categories;
  if (!Array.isArray(links)) return null;
  const primary = links.find((l: Row) => l?.is_primary) ?? links[0];
  const cat = primary?.categories;
  return (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? null;
}

function mapTestimonial(row: Row): Testimonial {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorAvatarUrl: row.author_avatar_url,
    quote: row.quote,
    rating: row.rating,
    createdAt: row.created_at ?? null,
    categoryName: primaryCategoryName(row),
  };
}

export async function getApprovedTestimonials(limit = 9): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, author_role, author_avatar_url, quote, rating, created_at, business:businesses(business_categories(is_primary, categories(name)))")
    .eq("status", "approved")
    .eq("is_active", true)
    .order("sort_order")
    .order("created_at", { ascending: false })
    .limit(limit);

  // עמודת status נוספת ב-0015. אם המיגרציה טרם הורצה, נופלים
  // לשליפה לפי is_active בלבד במקום להפיל את עמוד הבית.
  if (error) {
    const { data: legacy } = await supabase
      .from("testimonials")
      .select("id, author_name, author_role, author_avatar_url, quote, rating")
      .eq("is_active", true)
      .order("sort_order")
      .limit(limit);
    return (legacy ?? []).map(mapTestimonial);
  }

  return (data ?? []).map(mapTestimonial);
}

/** ממוצע ומספר הביקורות המאושרות — לרצועת האמון בעמוד הבית. */
export async function getTestimonialStats(): Promise<{ avg: number; count: number }> {
  if (!isSupabaseConfigured) return { avg: 0, count: 0 };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { avg: 0, count: 0 };

  const { data } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("status", "approved")
    .eq("is_active", true)
    .not("rating", "is", null);

  const ratings = (data ?? []).map((r) => Number(r.rating)).filter((n) => n > 0);
  if (ratings.length === 0) return { avg: 0, count: 0 };

  return {
    avg: Math.round((ratings.reduce((s, n) => s + n, 0) / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

/**
 * התפלגות הדירוגים — כמה ביקורות בכל דרגה מ-5 עד 1.
 *
 * מוחזר תמיד כחמש שורות, גם כשדרגה מסוימת ריקה: פס ההתפלגות אמור
 * להראות חמישה פסים קבועים, ודילוג על דרגה בלי ביקורות היה מזיז
 * את כל השאר ומשנה את משמעות התצוגה.
 */
export async function getRatingBreakdown(): Promise<{ stars: number; count: number }[]> {
  const empty = [5, 4, 3, 2, 1].map((stars) => ({ stars, count: 0 }));
  if (!isSupabaseConfigured) return empty;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return empty;

  const { data } = await supabase
    .from("testimonials")
    .select("rating")
    .eq("status", "approved")
    .eq("is_active", true)
    .not("rating", "is", null);

  const tally = new Map<number, number>();
  for (const r of data ?? []) {
    const n = Number(r.rating);
    if (n >= 1 && n <= 5) tally.set(n, (tally.get(n) ?? 0) + 1);
  }
  return empty.map(({ stars }) => ({ stars, count: tally.get(stars) ?? 0 }));
}
