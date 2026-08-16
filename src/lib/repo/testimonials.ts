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

function mapTestimonial(row: Row): Testimonial {
  return {
    id: row.id,
    authorName: row.author_name,
    authorRole: row.author_role,
    authorAvatarUrl: row.author_avatar_url,
    quote: row.quote,
    rating: row.rating,
  };
}

export async function getApprovedTestimonials(limit = 9): Promise<Testimonial[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, author_role, author_avatar_url, quote, rating")
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
