"use client";

import { useState, useTransition } from "react";
import { Check, Eye, EyeOff, RotateCcw, Trash2, X } from "lucide-react";
import { Rating } from "@/components/ui/Rating";
import { formatRelative } from "@/lib/utils";
import {
  deleteTestimonial, moderateTestimonial, toggleTestimonialActive,
} from "@/app/admin/testimonials/actions";

export interface ModerationTestimonial {
  id: string;
  authorName: string;
  authorRole: string | null;
  quote: string;
  rating: number | null;
  status: string;
  isActive: boolean;
  createdAt: string;
}

export function TestimonialModerationList({ items }: { items: ModerationTestimonial[] }) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function act(id: string, fn: () => Promise<{ ok: boolean; error?: string }>, removes = true) {
    if (removes) setHidden((prev) => new Set(prev).add(id));
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

  const visible = items.filter((t) => !hidden.has(t.id));

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      {visible.map((t) => (
        <article key={t.id} className="rounded-lg border border-ink-200/70 bg-white p-5">
          <div className="mb-2 flex flex-wrap items-center gap-2.5">
            {t.rating && <Rating value={t.rating} size="sm" showValue={false} variant="stars" />}
            <span className="font-bold text-ink-900">{t.authorName}</span>
            {t.authorRole && <span className="text-xs text-ink-400">{t.authorRole}</span>}
            <span className="text-2xs text-ink-400">{formatRelative(t.createdAt)}</span>
            {t.status === "approved" && !t.isActive && (
              <span className="rounded-full border border-ink-200 bg-ink-100 px-2 py-0.5 text-2xs font-bold text-ink-500">
                מוסתר מהאתר
              </span>
            )}
          </div>

          <blockquote className="mb-4 whitespace-pre-line text-sm leading-relaxed text-ink-600">
            {t.quote}
          </blockquote>

          <div className="flex flex-wrap gap-2">
            {t.status !== "approved" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(t.id, () => moderateTestimonial(t.id, "approved"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs bg-success-500 px-4 text-xs font-bold text-white transition-colors hover:bg-success-700 disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                אישור ופרסום
              </button>
            )}
            {t.status !== "rejected" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(t.id, () => moderateTestimonial(t.id, "rejected"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-ink-200 px-4 text-xs font-bold text-ink-600 transition-colors hover:border-danger-500/50 hover:text-danger-500 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                דחייה
              </button>
            )}
            {t.status !== "pending" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(t.id, () => moderateTestimonial(t.id, "pending"))}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-ink-200 px-4 text-xs font-bold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                החזרה לבדיקה
              </button>
            )}
            {t.status === "approved" && (
              <button
                type="button"
                disabled={pending}
                onClick={() => act(t.id, () => toggleTestimonialActive(t.id, !t.isActive), false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs border border-ink-200 px-4 text-xs font-bold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                {t.isActive
                  ? <><EyeOff className="h-3.5 w-3.5" aria-hidden="true" />הסתרה מהאתר</>
                  : <><Eye className="h-3.5 w-3.5" aria-hidden="true" />הצגה באתר</>}
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("למחוק את הביקורת לצמיתות?")) act(t.id, () => deleteTestimonial(t.id));
              }}
              className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-xs px-3 text-xs font-bold text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              מחיקה
            </button>
          </div>
        </article>
      ))}

      {visible.length === 0 && items.length > 0 && (
        <p className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-12 text-center text-sm text-ink-500">
          סיימתם לעבור על כל הביקורות בתצוגה הזו.
        </p>
      )}
    </div>
  );
}
