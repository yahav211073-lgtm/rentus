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
 *
 * הרצועה לא פורשת את עצמה על רוחב המסך אלא מקבלת className מבחוץ.
 * בהדמיה היא יושבת בתוך רוחב העמודה הראשית, מיושרת עם רשת הכרטיסים
 * שמעליה ולא עם קצות המסך — ולכן המעטפת היא באחריות מי שממקם אותה.
 */
export async function StatsBand({ className }: { className?: string } = {}) {
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
    <section className={`overflow-hidden rounded-lg bg-brand-950 ${className ?? ""}`}>
      <RevealStagger
        className={`grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 ${STATS_COLS[stats.length] ?? "sm:grid-cols-4"} sm:divide-x sm:divide-x-reverse sm:divide-white/10`}
      >
        {stats.map((stat) => (
          <RevealItem key={stat.id}>
            <div className="flex flex-col items-center gap-1 px-4 py-6 text-center">
              <p className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                <Counter value={stat.value} />
              </p>
              <p className="text-sm text-white/55">{stat.label}</p>
            </div>
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}

/* מחלקות מלאות — Tailwind סורק טקסט ולא מייצר מחרוזת מורכבת. */
const STATS_COLS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
};
