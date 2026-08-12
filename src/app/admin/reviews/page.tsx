import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewModerationList } from "@/components/admin/ReviewModerationList";

export const metadata = { title: "ביקורות ממתינות", robots: { index: false, follow: false } };

export default async function AdminReviewsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase!
    .from("reviews")
    .select("id, rating, title, body, author_name, business:businesses(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">ביקורות ממתינות לאישור</h1>
      <ReviewModerationList
        reviews={(data ?? []).map((r) => ({
          id: r.id,
          rating: r.rating,
          title: r.title,
          body: r.body,
          authorName: r.author_name,
          businessName: (r.business as unknown as { name: string } | null)?.name ?? "עסק לא ידוע",
        }))}
      />
    </div>
  );
}
