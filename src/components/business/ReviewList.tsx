import { MessageSquareQuote, ThumbsUp, UserRound } from "lucide-react";
import type { Review } from "@/types/domain";
import { Rating } from "@/components/ui/Rating";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/utils";

/**
 * ביקורות.
 *
 * התפלגות הכוכבים מוצגת לצד הממוצע ולא מתחתיו. זה הפרט שהופך דירוג
 * ממספר יחיד למידע: 4.5 שמורכב מהמון 5 וכמה 4 שונה לגמרי מ-4.5
 * שמורכב מ-5 ומ-1 מעורבבים, והמשתמש צריך לראות את ההבדל.
 *
 * ההתפלגות מחושבת מהביקורות שהתקבלו בפועל, ולכן היא מוצגת רק כשיש
 * ביקורות מאושרות. סרגלי אפס ליד ממוצע 5.0 היו נראים כמו באג.
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
  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => Math.round(r.rating) === star).length;
    const pct = reviews.length ? (count / reviews.length) * 100 : 0;
    return { star, count, pct };
  });

  return (
    <section className="rounded-xl border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(12,29,64,0.05)] sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink-900">
          מה הלקוחות אומרים
          {reviewCount > 0 && <span className="ms-2 text-ink-400">({reviewCount})</span>}
        </h2>
        <ButtonLink href="#write-review" variant="secondary" size="sm">
          כתיבת ביקורת
        </ButtonLink>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquareQuote className="h-6 w-6" />}
          title="עדיין אין ביקורות"
          description={`היו הראשונים לספר על החוויה שלכם עם ${businessName} — זה מה שעוזר למי שמחפש אחריכם.`}
          action={
            <ButtonLink href="#write-review" variant="primary" size="md">
              כתיבת הביקורת הראשונה
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          {/* סיכום */}
          <div className="rounded-lg bg-ink-50 p-5 text-center lg:h-fit">
            <p className="font-display text-5xl font-extrabold leading-none text-ink-900">
              {ratingAvg.toFixed(1)}
            </p>
            <Rating value={ratingAvg} size="md" showValue={false} variant="stars" className="mt-2.5 justify-center" />
            <p className="mt-2 text-xs text-ink-400">
              {reviewCount === 1 ? "ביקורת אחת" : `${reviewCount} ביקורות`}
            </p>

            <ul className="mt-5 space-y-1.5 border-t border-ink-200/70 pt-4">
              {distribution.map(({ star, count, pct }) => (
                <li key={star} className="flex items-center gap-2.5">
                  <span className="w-8 shrink-0 text-start text-xs tabular-nums text-ink-500">
                    {star} ★
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-ink-200">
                    <span
                      className="block h-full rounded-full bg-gold-400"
                      style={{ width: `${pct}%` }}
                    />
                  </span>
                  <span className="w-5 shrink-0 text-end text-xs tabular-nums text-ink-400">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* רשימה */}
          <ul className="divide-y divide-ink-100">
            {reviews.map((r) => (
              <li key={r.id} className="py-5 first:pt-0 last:pb-0">
                <article>
                  <header className="mb-2.5 flex items-start gap-3">
                    <span
                      aria-hidden="true"
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-100 text-ink-400"
                    >
                      <UserRound className="h-5 w-5" strokeWidth={1.8} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-ink-800">{r.authorName}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Rating value={r.rating} size="sm" showValue={false} variant="stars" />
                        <time dateTime={r.createdAt} className="text-xs text-ink-400">
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
                    /* תשובת בעל העסק: הזחה + רקע מותג עדין, בלי פס צבע
                       עבה בצד. הרקע והכותרת כבר מבדילים בין התשובה
                       לביקורת, והפס רק הוסיף רעש. */
                    <div className="mt-3 ms-3 rounded-sm bg-brand-50/70 p-3.5">
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
        </div>
      )}
    </section>
  );
}
