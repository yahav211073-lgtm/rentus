"use client";

import { useTransition } from "react";
import { Check, X } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { moderateReview } from "@/app/admin/reviews/actions";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string | null;
  businessName: string;
}

export function ReviewModerationList({ reviews }: { reviews: ReviewRow[] }) {
  const [pending, startTransition] = useTransition();

  if (reviews.length === 0) {
    return <p className="py-10 text-center text-ink-400">אין ביקורות ממתינות.</p>;
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-lg border border-ink-200/70 bg-white p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-bold text-ink-800">{r.authorName ?? "אנונימי"} → {r.businessName}</p>
              <Rating value={r.rating} size="sm" showValue={false} />
            </div>
            <div className="flex gap-1.5">
              <button
                type="button" disabled={pending}
                onClick={() => startTransition(async () => { await moderateReview(r.id, "approved"); })}
                className="inline-flex items-center gap-1 rounded-xs bg-success-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-success-500/90 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" /> אישור
              </button>
              <button
                type="button" disabled={pending}
                onClick={() => startTransition(async () => { await moderateReview(r.id, "rejected"); })}
                className="inline-flex items-center gap-1 rounded-xs border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 hover:bg-ink-50 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" /> דחייה
              </button>
            </div>
          </div>
          {r.title && <p className="font-bold text-ink-800">{r.title}</p>}
          {r.body && <p className="text-sm text-ink-600">{r.body}</p>}
        </li>
      ))}
    </ul>
  );
}
