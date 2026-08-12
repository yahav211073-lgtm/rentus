"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createBanner, createPopup, deleteBanner, deletePopup, toggleBannerActive, togglePopupActive,
} from "@/app/admin/ads/actions";

interface Placement { key: string; label: string }
interface BannerRow { id: string; title: string; placementKey: string; assetUrl: string | null; href: string | null; isActive: boolean }
interface PopupRow { id: string; title: string; heading: string | null; ctaLabel: string | null; isActive: boolean }

export function AdsManager({
  placements, banners, popups,
}: { placements: Placement[]; banners: BannerRow[]; popups: PopupRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-1 font-display text-base font-bold text-ink-900">באנרים צדדיים</h2>
        <p className="mb-4 text-xs text-ink-400">מוצגים בצדדי האתר ובמיקומים ייעודיים. ריק = לא פעיל עד שתסמנו.</p>

        <form
          action={(fd) => startTransition(async () => { await createBanner(fd); })}
          className="mb-5 grid gap-2.5 rounded-md bg-ink-50 p-4 sm:grid-cols-2"
        >
          <input name="title" placeholder="שם פנימי לזיהוי" required className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400" />
          <select name="placementKey" required className="h-10 rounded-sm border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400">
            <option value="">בחרו מיקום</option>
            {placements.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
          <input name="assetUrl" placeholder="כתובת תמונה (URL)" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 sm:col-span-2" />
          <input name="alt" placeholder="טקסט חלופי (נגישות)" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400" />
          <input name="href" placeholder="קישור בלחיצה" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400" />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" name="isActive" className="h-4 w-4 accent-brand-700" /> פעיל מיד
          </label>
          <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>הוספת באנר</Button>
        </form>

        <ul className="divide-y divide-ink-100">
          {banners.map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink-800">{b.title}</p>
                <p className="truncate text-xs text-ink-400">{b.placementKey} · {b.href ?? "ללא קישור"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <input
                    type="checkbox" checked={b.isActive} disabled={pending}
                    onChange={(e) => startTransition(async () => { await toggleBannerActive(b.id, e.target.checked); })}
                    className="h-3.5 w-3.5 accent-brand-700"
                  />
                  פעיל
                </label>
                <button
                  type="button" disabled={pending}
                  onClick={() => { if (confirm(`למחוק את "${b.title}"?`)) startTransition(async () => { await deleteBanner(b.id); }); }}
                  className="text-ink-300 hover:text-danger-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {banners.length === 0 && <li className="py-6 text-center text-sm text-ink-400">אין עדיין באנרים.</li>}
        </ul>
      </section>

      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-1 font-display text-base font-bold text-ink-900">מודעות קופצות (פופאפ)</h2>
        <p className="mb-4 text-xs text-ink-400">
          כבויות כברירת מחדל בכוונה — פעילו רק כשהתוכן מוכן. אחת מוצגת בכל טעינת עמוד לכל היותר.
        </p>

        <form
          action={(fd) => startTransition(async () => { await createPopup(fd); })}
          className="mb-5 grid gap-2.5 rounded-md bg-ink-50 p-4 sm:grid-cols-2"
        >
          <input name="title" placeholder="שם פנימי לזיהוי" required className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 sm:col-span-2" />
          <input name="heading" placeholder="כותרת בפופאפ" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 sm:col-span-2" />
          <textarea name="body" placeholder="טקסט" rows={2} className="rounded-sm border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400 sm:col-span-2" />
          <input name="assetUrl" placeholder="כתובת תמונה (URL, לא חובה)" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 sm:col-span-2" />
          <input name="ctaLabel" placeholder="טקסט כפתור" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400" />
          <input name="ctaHref" placeholder="קישור הכפתור" className="h-10 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400" />
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" name="isActive" className="h-4 w-4 accent-brand-700" /> פעיל מיד
          </label>
          <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>הוספת פופאפ</Button>
        </form>

        <ul className="divide-y divide-ink-100">
          {popups.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-ink-800">{p.title}</p>
                <p className="truncate text-xs text-ink-400">{p.heading ?? "—"}</p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-600">
                  <input
                    type="checkbox" checked={p.isActive} disabled={pending}
                    onChange={(e) => startTransition(async () => { await togglePopupActive(p.id, e.target.checked); })}
                    className="h-3.5 w-3.5 accent-brand-700"
                  />
                  פעיל
                </label>
                <button
                  type="button" disabled={pending}
                  onClick={() => { if (confirm(`למחוק את "${p.title}"?`)) startTransition(async () => { await deletePopup(p.id); }); }}
                  className="text-ink-300 hover:text-danger-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {popups.length === 0 && <li className="py-6 text-center text-sm text-ink-400">אין עדיין פופאפים.</li>}
        </ul>
      </section>
    </div>
  );
}
