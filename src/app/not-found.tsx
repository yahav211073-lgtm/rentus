import Link from "next/link";
import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "העמוד לא נמצא" };

/**
 * 404.
 *
 * במקום מבוי סתום — שלוש דרכים להמשיך. עמוד 404 שמציע רק "חזרה
 * לעמוד הבית" מבזבז את הכוונה שהביאה את הגולש לכאן מלכתחילה.
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>

      <h1 className="mb-2 font-display text-2xl font-extrabold text-ink-900">
        העמוד הזה לא קיים
      </h1>
      <p className="mb-6 text-base leading-relaxed text-ink-600">
        ייתכן שהקישור השתנה, או שהעסק שחיפשתם כבר לא מפורסם באתר.
      </p>

      <div className="flex flex-wrap justify-center gap-2.5">
        <ButtonLink href="/search" variant="primary" size="lg">חיפוש עסקים</ButtonLink>
        <ButtonLink href="/categories" variant="secondary" size="lg">כל הקטגוריות</ButtonLink>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        או <Link href="/" className="font-bold text-brand-700 hover:text-brand-500">חזרה לעמוד הבית</Link>
      </p>
    </div>
  );
}
