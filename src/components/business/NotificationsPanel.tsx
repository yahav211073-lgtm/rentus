"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { markNotificationsRead } from "@/app/business/dashboard/actions";

export interface OwnerNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

const TONE: Record<string, string> = {
  "business.approved": "border-success-500/30 bg-success-50",
  "business.rejected": "border-danger-500/30 bg-danger-50",
  "business.requested": "border-brand-200 bg-brand-50",
};

/**
 * התראות לבעל העסק.
 *
 * זו החוליה שסוגרת את זרימת האישור: בלעדיה, מי שהגיש בקשה היה צריך
 * לנחש אם היא אושרה, או להיכנס שוב ושוב לבדוק. ההתראה נכתבת בשרת
 * ברגע ההחלטה, ולכן היא קיימת גם אם המשתמש לא היה מחובר באותו רגע.
 */
export function NotificationsPanel({ notifications }: { notifications: OwnerNotification[] }) {
  const [pending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  const unread = notifications.filter((n) => !n.readAt);
  const visible = dismissed ? notifications.filter((n) => n.readAt) : notifications;

  if (notifications.length === 0) return null;

  return (
    <section className="mb-6 rounded-lg border border-ink-200/70 bg-white p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink-900">
          <Bell className="h-4 w-4 text-brand-600" aria-hidden="true" />
          עדכונים
          {unread.length > 0 && (
            <span className="rounded-full bg-accent-400 px-2 py-0.5 text-2xs font-bold text-brand-950">
              {unread.length} חדשים
            </span>
          )}
        </h2>
        {unread.length > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markNotificationsRead(unread.map((n) => n.id));
                setDismissed(true);
              })
            }
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-500 transition-colors hover:text-brand-700"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            סימון הכל כנקרא
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {visible.slice(0, 6).map((n) => {
          const inner = (
            <>
              <span className="block font-bold text-ink-900">{n.title}</span>
              {n.body && <span className="block text-sm text-ink-600">{n.body}</span>}
              <span className="mt-0.5 block text-2xs text-ink-400">{formatRelative(n.createdAt)}</span>
            </>
          );

          return (
            <li
              key={n.id}
              className={`rounded-sm border p-3 ${
                n.readAt ? "border-ink-200 bg-white" : TONE[n.type] ?? "border-brand-200 bg-brand-50"
              }`}
            >
              {n.link ? (
                <Link href={n.link} className="block transition-opacity hover:opacity-80">{inner}</Link>
              ) : inner}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
