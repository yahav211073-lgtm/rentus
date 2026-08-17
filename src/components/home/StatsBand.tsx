import { Counter } from "@/components/motion/Counter";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * רצועת המספרים.
 *
 * כל מספר כאן נספר מהמסד. קודם ישבו כאן ערכים קבועים מקובץ ה-seed
 * ("14,200 עסקים מאומתים", "96,500 ביקורות") — מספרים שנראו טוב
 * ולא היו נכונים. הצהרה שקרית על גודל האינדקס היא בדיוק סוג הדבר
 * שהורס אמון ברגע שמישהו סופר את התוצאות בעצמו.
 *
 * כשאין עדיין תוכן אמיתי הרצועה לא מוצגת בכלל. רצועת אפסים לא
 * מוסיפה כלום — היא רק מכריזה שהאתר ריק.
 */
export async function StatsBand() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const head = (table: string) => supabase.from(table).select("id", { count: "exact", head: true });

  const [businesses, verified, reviews, cities] = await Promise.all([
    head("businesses").eq("status", "published"),
    head("businesses").eq("status", "published").eq("is_verified", true),
    head("reviews").eq("status", "approved"),
    head("cities").eq("is_active", true),
  ]);

  const published = businesses.count ?? 0;
  if (published === 0) return null;

  const stats = [
    { id: "businesses", label: "חברות רשומות", value: published },
    { id: "verified", label: "חברות מאומתות", value: verified.count ?? 0 },
    { id: "reviews", label: "ביקורות שאושרו", value: reviews.count ?? 0 },
    { id: "cities", label: "ערים ברחבי הארץ", value: cities.count ?? 0 },
  ].filter((s) => s.value > 0);

  if (stats.length < 2) return null;

  return (
    <section className="bg-brand-950 py-10 sm:py-12">
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <RevealStagger
          className={`grid divide-y divide-white/10 sm:grid-cols-2 lg:divide-y-0 lg:divide-x lg:divide-x-reverse ${
            stats.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          {stats.map((stat) => (
            <RevealItem key={stat.id}>
              <div className="flex flex-col items-center gap-1 px-4 py-5 text-center">
                <p className="font-display text-3xl font-extrabold text-white sm:text-4xl">
                  <Counter value={stat.value} />
                </p>
                <p className="text-sm text-white/55">{stat.label}</p>
              </div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
