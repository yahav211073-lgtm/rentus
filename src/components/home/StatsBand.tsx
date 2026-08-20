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
      {/* שורה אחת גם במובייל, לא ערימה.
          הערימה נתנה שלושה פאנלים בגובה מלא — כמעט 400px של מסך
          כדי להציג שלושה מספרים בני ספרה אחת. ברשת אופקית אותם
          שלושה מספרים תופסים 78px, וההשוואה ביניהם — שהיא כל
          תפקידה של הרצועה — נקראת במבט אחד במקום בשלוש גלילות.
          המפרידים הם gap של פיקסל אחד על רקע לבן-שקוף ולא divide-*:
          ב-4 פריטים הרשת היא 2x2 במובייל ושורה אחת בדסקטופ, ו-divide
          מציב גבול לפי סדר הילדים ולא לפי מיקומם ברשת — כלומר קו
          במקום הלא נכון בדיוק בפריט השלישי. */}
      <RevealStagger
        className={`grid gap-px bg-white/10 ${STATS_COLS_MOBILE[stats.length] ?? "grid-cols-4"} ${STATS_COLS[stats.length] ?? "sm:grid-cols-4"}`}
      >
        {stats.map((stat) => (
          <RevealItem key={stat.id} className="bg-brand-950">
            <div className="flex flex-col items-center gap-0.5 px-2 py-4 text-center sm:gap-1 sm:px-4 sm:py-6">
              <p className="font-display text-xl font-extrabold text-white sm:text-3xl">
                <Counter value={stat.value} />
              </p>
              <p className="text-2xs leading-tight text-white/55 sm:text-sm">{stat.label}</p>
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

/* במובייל ארבעה תאים בשורה אחת צרים מדי (78px לכל אחד, והתווית
   "ערים ברחבי הארץ" נשברת לשלוש שורות), ולכן ארבעה מתפצלים ל-2x2
   ושלושה נשארים בשורה. */
const STATS_COLS_MOBILE: Record<number, string> = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2",
};
