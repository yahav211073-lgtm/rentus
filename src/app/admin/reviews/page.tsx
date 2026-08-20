import Link from "next/link";
import { MessageSquareQuote } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewModerationList, type ModerationReview } from "@/components/admin/ReviewModerationList";

export const metadata = { title: "ביקורות עסקים", robots: { index: false, follow: false } };

const TABS = [
  { key: "pending", label: "ממתינות" },
  { key: "approved", label: "מאושרות" },
  { key: "rejected", label: "נדחו" },
] as const;

export default async function AdminReviewsPage({
  searchParams,
}: { searchParams: Promise<{ status?: string }> }) {
  const { status = "pending" } = await searchParams;
  const active = TABS.some((t) => t.key === status) ? status : "pending";

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase
    .from("reviews")
    .select("id, rating, title, body, author_name, status, created_at, business:businesses(name, slug)")
    .eq("status", active)
    .order("created_at", { ascending: false })
    .limit(200);

  const reviews: ModerationReview[] = (data ?? []).map((r) => ({
    id: r.id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    authorName: r.author_name,
    status: r.status,
    createdAt: r.created_at,
    business: (r.business as unknown as { name: string; slug: string } | null) ?? null,
  }));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">ביקורות על עסקים</h1>
      <p className="mb-6 text-sm text-ink-500">
        ביקורת מתפרסמת בעמוד העסק רק אחרי אישור כאן. דחייה משאירה אותה במערכת אבל מסתירה אותה מהאתר.
      </p>

      <div className="mb-5 flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?status=${t.key}`}
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

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-800">
            {active === "pending" ? "אין ביקורות שממתינות לאישור" : "אין ביקורות בסטטוס הזה"}
          </p>
          <p className="mt-1 text-sm text-ink-500">
            ביקורות שמשתמשים כותבים בעמודי העסקים יגיעו לכאן לבדיקה.
          </p>
        </div>
      ) : (
        <ReviewModerationList reviews={reviews} />
      )}
    </div>
  );
}
