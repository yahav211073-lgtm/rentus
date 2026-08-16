import { Skeleton } from "@/components/ui/Skeleton";

/** מצב טעינה למסכי הניהול — שומר על הפריסה כדי שהמסך לא יקפוץ. */
export default function AdminLoading() {
  return (
    <div>
      <Skeleton className="mb-2 h-8 w-52" />
      <Skeleton className="mb-6 h-4 w-80" />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-ink-200/70 bg-white p-5">
            <Skeleton className="mb-3 h-9 w-9 rounded-sm" />
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-ink-200/70 bg-white p-4">
            <Skeleton className="mb-2 h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
        ))}
      </div>
    </div>
  );
}
