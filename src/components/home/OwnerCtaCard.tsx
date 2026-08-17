import Link from "next/link";
import { ArrowLeft, TrendingUp } from "lucide-react";

/**
 * כרטיס "בעל עסק? הצטרפו היום" — צמוד לרשת העסקים המומלצים, לא
 * להירו. זה מבדיל בין שני קהלים שונים: מי שמחפש עסק (ההירו) לעומת
 * מי שרוצה לפרסם עסק (הכרטיס הזה), כמו בהדמיה שהעמוד מבוסס עליה.
 */
export function OwnerCtaCard({ className }: { className?: string }) {
  return (
    <Link
      href="/business/register"
      className={`group flex min-h-[130px] flex-col justify-center bg-brand-950 p-5 transition-colors hover:bg-brand-900 ${className ?? ""}`}
    >
      <span className="mb-3 grid h-10 w-10 place-items-center rounded-sm bg-accent-400/15">
        <TrendingUp className="h-5 w-5 text-accent-400" strokeWidth={2.2} />
      </span>
      <p className="mb-1 font-display text-md font-extrabold leading-tight text-white">
        בעל חברה? הצטרפו היום
      </p>
      <p className="mb-3 text-xs leading-relaxed text-white/60">
        רישום פרופיל בסיסי חינם — הלקוחות כבר מחפשים אתכם.
      </p>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-accent-400">
        לפרטים
        <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1" />
      </span>
    </Link>
  );
}
