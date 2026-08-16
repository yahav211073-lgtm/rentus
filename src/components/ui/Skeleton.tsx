import { cn } from "@/lib/utils";

/**
 * שלד טעינה.
 *
 * הפעימה מבוטלת עבור מי שביקש הפחתת תנועה — הבהוב מתמשך הוא בדיוק
 * סוג האנימציה שגורם לאי-נוחות אמיתית, לא רק לחוסר העדפה.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-sm bg-ink-200/70 motion-reduce:animate-none",
        className,
      )}
    />
  );
}

/** שלד של רשת כרטיסים — המבנה הנפוץ ביותר באתר. */
export function CardGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      role="status"
      aria-label="טוען תוכן"
      className={cn("grid gap-5 sm:grid-cols-2 lg:grid-cols-4", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-lg border border-ink-200/70 bg-white">
          <Skeleton className="aspect-[16/10] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
      <span className="sr-only">טוען…</span>
    </div>
  );
}
