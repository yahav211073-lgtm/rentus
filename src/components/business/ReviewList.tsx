import { MessageSquareQuote, ThumbsUp } from "lucide-react";
import type { Review } from "@/types/domain";
import { Rating } from "@/components/ui/Rating";
import { CoverArt } from "@/components/ui/CoverArt";
import { ButtonLink } from "@/components/ui/Button";
import { formatRelative } from "@/lib/utils";

/**
 * ביקורות.
 *
 * התפלגות הכוכבים מוצגת מעל הרשימה. זה הפרט שהופך דירוג ממספר
 * יחיד למידע: 4.5 שמורכב מהמון 5 וכמה 4 שונה לגמרי מ-4.5 שמורכב
 * מ-5 ומ-1 מעורבבים, והמשתמש צריך לראות את ההבדל.
 *
 * תשובת בעל העסק מוצגת בתוך הביקורת, בהזחה — ולא כפריט נפרד.
 * בעל עסק שטורח להשיב מרוויח אמון, וההצגה צריכה לשקף את זה.
 */

interface Props {
  reviews: Review[];
  businessName: string;
  ratingAvg: number;
  reviewCount: number;
}

export function ReviewList({ reviews, businessName, ratingAvg, reviewCount }: Props) {
  // התפלגות מהביקורות המוצגות. בגרסה המחוברת מגיעה כסיכום מה-DB,
  // כי לא טוענים 300 ביקורות רק כדי לצייר חמישה פסים.
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-bold text-ink-900">
          ביקורות ({reviewCount})
        </h2>
        <ButtonLink href="#write-review" variant="secondary" size="sm">
          כתיבת ביקורת
        </ButtonLink>
      </div>

      {reviewCount > 0 && (
        <div className="mb-7 grid gap-6 rounded-lg bg-ink-50 p-5 sm:grid-cols-[auto_1fr] sm:gap-8">
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold text-ink-900">
              {ratingAvg.toFixed(1)}
            </p>
            <Rating value={ratingAvg} size="sm" showValue={false} className="mt-1 justify-center" />
            <p className="mt-1 text-xs text-ink-400">{reviewCount} ביקורות</p>
          </div>

          <ul className="space-y-1.5 self-center">
            {distribution.map(({ star, count, pct }) => (
              <li key={star} className="flex items-center gap-2.5">
                <span className="w-8 shrink-0 text-xs tabular-nums text-ink-500">{star} ★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200">
                  <span
                    className="block h-full rounded-full bg-accent-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-end text-xs tabular-nums text-ink-400">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 p-8 text-center">
          <MessageSquareQuote className="mx-auto mb-3 h-8 w-8 text-ink-300" />
          <p className="mb-1 font-bold text-ink-700">עדיין אין ביקורות</p>
          <p className="text-sm text-ink-500">
            היו הראשונים לספר על החוויה שלכם עם {businessName}.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-ink-100">
          {reviews.map((r) => (
            <li key={r.id} className="py-5 first:pt-0 last:pb-0">
              <article>
                <header className="mb-2.5 flex items-start gap-3">
                  <CoverArt
                    seed={r.authorName}
                    label={r.authorName.charAt(0)}
                    compact
                    className="h-10 w-10 shrink-0 rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-ink-800">{r.authorName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Rating value={r.rating} size="sm" showValue={false} />
                      <time
                        dateTime={r.createdAt}
                        className="text-xs text-ink-400"
                      >
                        {formatRelative(r.createdAt)}
                      </time>
                    </div>
                  </div>
                </header>

                {r.title && <h3 className="mb-1 font-bold text-ink-800">{r.title}</h3>}
                {r.body && (
                  <p className="text-base leading-relaxed text-ink-600">{r.body}</p>
                )}

                {r.ownerReply && (
                  <div className="mt-3 rounded-sm border-s-2 border-brand-300 bg-brand-50/60 p-3.5">
                    <p className="mb-1 text-xs font-bold text-brand-700">
                      תשובת {businessName}
                    </p>
                    <p className="text-sm leading-relaxed text-ink-600">{r.ownerReply}</p>
                  </div>
                )}

                {r.helpfulCount > 0 && (
                  <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-400">
                    <ThumbsUp className="h-3.5 w-3.5" />
                    {r.helpfulCount} מצאו את הביקורת מועילה
                  </p>
                )}
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
