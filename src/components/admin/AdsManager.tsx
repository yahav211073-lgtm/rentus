"use client";

import { useState, useTransition } from "react";
import { ImageOff, Megaphone, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  createBanner, createPopup, deleteBanner, deletePopup,
  toggleBannerActive, togglePopupActive, updateBanner,
} from "@/app/admin/ads/actions";

interface Placement { key: string; label: string; width: number | null; height: number | null }

export interface BannerRow {
  id: string;
  title: string;
  placementKey: string;
  assetUrl: string | null;
  alt: string | null;
  href: string | null;
  weight: number;
  priority: number;
  isActive: boolean;
}

interface PopupRow {
  id: string;
  title: string;
  heading: string | null;
  ctaLabel: string | null;
  isActive: boolean;
}

/**
 * ניהול באנרים ופופאפים.
 *
 * הרשימה מציגה תמונה ממוזערת אמיתית של כל באנר. זו לא קישוטיות:
 * בלי תצוגה מקדימה אי אפשר לדעת שהתמונה שהועלתה שבורה או חתוכה עד
 * שרואים אותה באתר החי — וזה בדיוק מה שקרה כאן קודם.
 */
export function AdsManager({
  placements, banners, popups,
}: { placements: Placement[]; banners: BannerRow[]; popups: PopupRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BannerRow | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (res.ok) onDone?.();
      else setError(res.error ?? "הפעולה נכשלה.");
    });
  }

  const placementLabel = (key: string) =>
    placements.find((p) => p.key === key)?.label ?? key;

  return (
    <div className="space-y-8">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base text-ink-900">באנרים</h2>
            <p className="mt-0.5 text-xs text-ink-400">
              באנרי הצד מוצגים רק במסכים רחבים מ-1600 פיקסלים, כדי שלא ידחפו את התוכן.
              אם אין באנר פעיל — לא מוצג כלום, בלי מסגרת ריקה.
            </p>
          </div>
          {!creating && !editing && (
            <Button
              type="button" variant="accent" size="md"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setCreating(true)}
            >
              באנר חדש
            </Button>
          )}
        </div>

        {(creating || editing) && (
          <BannerForm
            banner={editing}
            placements={placements}
            pending={pending}
            onCancel={() => { setCreating(false); setEditing(null); }}
            onSubmit={(fd) =>
              run(
                () => (editing ? updateBanner(editing.id, fd) : createBanner(fd)),
                () => { setCreating(false); setEditing(null); },
              )
            }
          />
        )}

        {banners.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-8 w-8" />} title="אין עדיין באנרים">
            העלו תמונת באנר כדי להתחיל. באנר נשמר כבוי עד שתסמנו אותו כפעיל.
          </EmptyState>
        ) : (
          <ul className="mt-5 divide-y divide-ink-100">
            {banners.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center gap-4 py-3">
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
                  {b.assetUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.assetUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-ink-300">
                      <ImageOff className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-ink-800">{b.title}</p>
                  <p className="truncate text-xs text-ink-400">
                    {placementLabel(b.placementKey)}
                    {b.href ? ` · ${b.href}` : " · ללא קישור"}
                  </p>
                  {!b.assetUrl && (
                    <p className="text-2xs font-semibold text-warning-700">חסרה תמונה — לא ניתן להפעיל</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <input
                      type="checkbox"
                      checked={b.isActive}
                      disabled={pending || !b.assetUrl}
                      onChange={(e) => run(() => toggleBannerActive(b.id, e.target.checked))}
                      className="h-3.5 w-3.5 accent-brand-700"
                    />
                    פעיל
                  </label>
                  <button
                    type="button"
                    onClick={() => { setCreating(false); setEditing(b); }}
                    aria-label={`עריכת ${b.title}`}
                    className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => { if (confirm(`למחוק את "${b.title}"?`)) run(() => deleteBanner(b.id)); }}
                    aria-label={`מחיקת ${b.title}`}
                    className="grid h-9 w-9 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
        <h2 className="mb-1 font-display text-base text-ink-900">מודעות קופצות (פופאפ)</h2>
        <p className="mb-4 text-xs text-ink-400">
          כבויות כברירת מחדל בכוונה — הפעילו רק כשהתוכן מוכן. מוצג פופאפ אחד לכל היותר בכל טעינת עמוד.
        </p>

        <form
          action={(fd) => run(() => createPopup(fd))}
          className="mb-5 grid gap-3 rounded-md bg-ink-50 p-4 sm:grid-cols-2"
        >
          <input
            name="title" placeholder="שם פנימי לזיהוי" required
            aria-label="שם פנימי"
            className="h-11 rounded-xs border border-ink-200 px-3 text-base outline-none focus:border-brand-400 sm:col-span-2"
          />
          <input
            name="heading" placeholder="כותרת שתוצג בפופאפ"
            aria-label="כותרת"
            className="h-11 rounded-xs border border-ink-200 px-3 text-base outline-none focus:border-brand-400 sm:col-span-2"
          />
          <textarea
            name="body" placeholder="טקסט" rows={2}
            aria-label="טקסט"
            className="rounded-xs border border-ink-200 px-3 py-2 text-base outline-none focus:border-brand-400 sm:col-span-2"
          />
          <ImageUploadField
            name="image" label="תמונה (לא חובה)" aspect="2/1" className="sm:col-span-2"
            hint="בלי תמונה יוצג פופאפ טקסטואלי נקי, לא מסגרת ריקה"
          />
          <input
            name="ctaLabel" placeholder="טקסט הכפתור"
            aria-label="טקסט הכפתור"
            className="h-11 rounded-xs border border-ink-200 px-3 text-base outline-none focus:border-brand-400"
          />
          <input
            name="ctaHref" placeholder="https://..." type="url" dir="ltr"
            aria-label="קישור הכפתור"
            className="h-11 rounded-xs border border-ink-200 px-3 text-base outline-none focus:border-brand-400"
          />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" name="isActive" className="h-4 w-4 accent-brand-700" /> פעיל מיד
          </label>
          <div>
            <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>
              הוספת פופאפ
            </Button>
          </div>
        </form>

        {popups.length === 0 ? (
          <EmptyState icon={<Megaphone className="h-8 w-8" />} title="אין פופאפים">
            פופאפ הוא כלי חזק ומעצבן כאחד. השתמשו בו במשורה.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-ink-100">
            {popups.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink-800">{p.title}</p>
                  <p className="truncate text-xs text-ink-400">
                    {p.heading ?? "ללא כותרת"}{p.ctaLabel ? ` · ${p.ctaLabel}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                    <input
                      type="checkbox" checked={p.isActive} disabled={pending}
                      onChange={(e) => run(() => togglePopupActive(p.id, e.target.checked))}
                      className="h-3.5 w-3.5 accent-brand-700"
                    />
                    פעיל
                  </label>
                  <button
                    type="button" disabled={pending}
                    onClick={() => { if (confirm(`למחוק את "${p.title}"?`)) run(() => deletePopup(p.id)); }}
                    aria-label={`מחיקת ${p.title}`}
                    className="grid h-9 w-9 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BannerForm({
  banner, placements, pending, onCancel, onSubmit,
}: {
  banner: BannerRow | null;
  placements: Placement[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  const [placement, setPlacement] = useState(banner?.placementKey ?? "");
  const selected = placements.find((p) => p.key === placement);

  return (
    <form
      action={onSubmit}
      className="grid gap-4 rounded-md border border-brand-200 bg-brand-50/40 p-4 sm:grid-cols-2"
    >
      <div className="flex items-center justify-between sm:col-span-2">
        <h3 className=" text-sm font-bold text-ink-900">
          {banner ? `עריכת "${banner.title}"` : "באנר חדש"}
        </h3>
        <button
          type="button" onClick={onCancel} aria-label="סגירת הטופס"
          className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 hover:bg-white"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">שם פנימי <span className="text-danger-500">*</span></span>
        <input
          name="title" required defaultValue={banner?.title}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">מיקום <span className="text-danger-500">*</span></span>
        <select
          name="placementKey" required value={placement}
          onChange={(e) => setPlacement(e.target.value)}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        >
          <option value="">בחרו מיקום</option>
          {placements.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {selected?.width && selected.height && (
          <span className="text-2xs text-ink-400">
            מידות מומלצות: {selected.width}×{selected.height} פיקסלים
          </span>
        )}
      </label>

      <ImageUploadField
        name="image"
        label="תמונת הבאנר"
        required={!banner}
        currentUrl={banner?.assetUrl}
        aspect={selected?.width && selected.height ? `${selected.width}/${selected.height}` : "16/9"}
        className="sm:col-span-2"
      />

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">טקסט חלופי (נגישות)</span>
        <input
          name="alt" defaultValue={banner?.alt ?? ""}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">קישור בלחיצה</span>
        <input
          name="href" type="url" dir="ltr" placeholder="https://" defaultValue={banner?.href ?? ""}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">עדיפות</span>
        <input
          name="priority" type="number" min={0} max={100} defaultValue={banner?.priority ?? 0}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        />
        <span className="text-2xs text-ink-400">גבוה יותר = מוצג לפני האחרים באותו מיקום</span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">משקל בסבב</span>
        <input
          name="weight" type="number" min={1} max={100} defaultValue={banner?.weight ?? 1}
          className="h-11 rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
        />
        <span className="text-2xs text-ink-400">בין באנרים באותה עדיפות: משקל 3 יוצג פי שלושה ממשקל 1</span>
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 sm:col-span-2">
        <input
          type="checkbox" name="isActive" defaultChecked={banner?.isActive}
          className="h-4 w-4 accent-brand-700"
        />
        פעיל באתר
      </label>

      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" variant="primary" size="md" loading={pending}>
          {banner ? "שמירת שינויים" : "הוספת באנר"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}

function EmptyState({
  icon, title, children,
}: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-300 px-6 py-12 text-center">
      <span className="mx-auto mb-3 block w-fit text-ink-300" aria-hidden="true">{icon}</span>
      <p className="font-display text-base font-bold text-ink-800">{title}</p>
      <p className="mt-1 text-sm text-ink-500">{children}</p>
    </div>
  );
}
