import Link from "next/link";
import { Star } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TestimonialModerationList, type ModerationTestimonial } from "@/components/admin/TestimonialModerationList";

export const metadata = { title: "ביקורות על האתר", robots: { index: false, follow: false } };

const TABS = [
  { key: "pending", label: "ממתינות" },
  { key: "approved", label: "מאושרות" },
  { key: "rejected", label: "נדחו" },
] as const;

export default async function AdminTestimonialsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const active = TABS.some((t) => t.key === status) ? status : "pending";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("testimonials")
    .select("id, author_name, author_role, quote, rating, status, is_active, created_at")
    .eq("status", active)
    .order("created_at", { ascending: false })
    .limit(200);

  const items: ModerationTestimonial[] = (data ?? []).map((t) => ({
    id: t.id,
    authorName: t.author_name,
    authorRole: t.author_role,
    quote: t.quote,
    rating: t.rating,
    status: t.status,
    isActive: t.is_active,
    createdAt: t.created_at,
  }));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">ביקורות על האתר</h1>
      <p className="mb-6 text-sm text-ink-500">
        ביקורות שגולשים מחוברים כתבו על הפלטפורמה. מוצגות בעמוד הבית רק אחרי אישור.
      </p>

      {error && (
        <div className="mb-5 rounded-lg border border-warning-500/40 bg-warning-50 p-4 text-sm text-ink-700">
          <p className="font-bold">טבלת הביקורות עדיין לא כוללת עמודת סטטוס.</p>
          <p className="mt-1">
            הריצו את המיגרציה <code className="rounded-xs bg-white px-1">0015_reviews_moderation_and_data_fix.sql</code>{" "}
            ב-Supabase כדי להפעיל את מסך המודרציה.
          </p>
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/testimonials?status=${t.key}`}
            aria-current={active === t.key ? "page" : undefined}
            className={`border-b-2 px-4 py-2.5 text-sm font-bold transition-colors ${
              active === t.key
                ? "border-brand-700 text-brand-800"
                : "border-transparent text-ink-400 hover:text-ink-700"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <Star className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-800">
            {active === "pending" ? "אין ביקורות שממתינות לאישור" : "אין ביקורות בסטטוס הזה"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            הטופס לכתיבת ביקורת על האתר נמצא בתחתית עמוד הבית.
          </p>
        </div>
      ) : (
        <TestimonialModerationList items={items} />
      )}
    </div>
  );
}
