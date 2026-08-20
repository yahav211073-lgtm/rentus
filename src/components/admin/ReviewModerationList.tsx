"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { formatRelative } from "@/lib/utils";
import { deleteReview, moderateReview } from "@/app/admin/reviews/actions";

export interface ModerationReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  status: string;
  createdAt: string;
  business: { name: string; slug: string } | null;
}

/**
 * רשימת מודרציה.
 *
 * הפעולה מסירה את הכרטיס מיידית מהתצוגה (אופטימי), כי מודרציה היא
 * עבודה של רצף — אישור, אישור, דחייה — והמתנה של חצי שנייה בין
 * לחיצה לתגובה הופכת אותה למייגעת. אם השרת מחזיר שגיאה הכרטיס חוזר.
 */
export function ReviewModerationList({ reviews }: { reviews: ModerationReview[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(id: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    setHidden((prev) => new Set(prev).add(id));
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "הפעולה נכשלה.");
        setHidden((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    });
  }

  const visible = reviews.filter((r) => !hidden.has(r.id));

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      {visible.length === 0 && reviews.length > 0 && (
        <p className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          סיימתם לעבור על כל הביקורות בתצוגה הזו.
        </p>
      )}

      {visible.map((r) => (
        <article key={r.id} className="rounded-lg border border-ink-200/70 bg-white p-5">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <Rating value={r.rating} size="sm" showValue={false} variant="stars" />
              <span className="font-bold text-ink-900">{r.authorName}</span>
              <span className="text-2xs text-ink-400">{formatRelative(r.createdAt)}</span>
            </div>
            {r.business && (
              <Link
                href={`/business/${r.business.slug}`}
                target="_blank"
                className="text-xs font-bold text-brand-700 hover:text-brand-500"
              >
                {r.business.name} ←
              </Link>
            )}
          </div>

          {r.title && <h3 className="mb-1 text-base font-bold text-ink-900">{r.title}</h3>}
          {r.body && <p className="mb-4 whitespace-pre-line text-sm leading-relaxed text-ink-600">{r.body}</p>}

          <div className="flex flex-wrap gap-2">
            {r.status !== "approved" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(r.id, () => moderateReview(r.id, "approved"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs bg-success-500 px-4 text-xs font-bold text-white transition-colors hover:bg-success-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                אישור ופרסום
              </button>
            )}
            {r.status !== "rejected" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(r.id, () => moderateReview(r.id, "rejected"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-ink-200 px-4 text-xs font-bold text-ink-600 transition-colors hover:border-danger-500/50 hover:text-danger-500 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                דחייה
              </button>
            )}
            {r.status !== "pending" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(r.id, () => moderateReview(r.id, "pending"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-ink-200 px-4 text-xs font-bold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                החזרה לבדיקה
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("למחוק את הביקורת לצמיתות?")) act(r.id, () => deleteReview(r.id));
              }}
              className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-xs px-3 text-xs font-bold text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              מחיקה
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
