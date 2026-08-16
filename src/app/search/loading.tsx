import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

/**
 * מצב טעינה לחיפוש.
 *
 * החיפוש הוא העמוד היחיד שבו ההמתנה מורגשת — הוא רץ שאילתת טקסט
 * מלא ושאילתת פאסטים במקביל. שלד שמשמר את הפריסה עדיף על ספינר
 * ממורכז, כי הוא מונע את הקפיצה שקורית כשהתוכן נכנס.
 */
export default function SearchLoading() {
  return (
    <div className="mx-auto max-w-[1480px] px-4 py-8 sm:px-6 lg:px-8">
      <Skeleton className="mb-6 h-9 w-64" />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg border border-ink-200/70 bg-white p-4">
              <Skeleton className="mb-3 h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
          ))}
        </div>
        <CardGridSkeleton count={6} className="lg:grid-cols-3" />
      </div>
    </div>
  );
}
