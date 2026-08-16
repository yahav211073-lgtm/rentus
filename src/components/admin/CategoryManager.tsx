"use client";

import { useState, useTransition } from "react";
import { ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  createCategory, createCity, deleteCategory, deleteCity, toggleCategoryActive, updateCategory,
} from "@/app/admin/categories/actions";

interface CategoryRow {
  id: string;
  name: string;
  parentId: string | null;
  isActive: boolean;
  imageUrl: string | null;
  businessCount: number;
}
interface CityRow { id: string; name: string }

/**
 * ניהול קטגוריות וערים.
 *
 * התמונה היא אזרח מדרגה ראשונה כאן ולא הגדרה נסתרת מאחורי אייקון:
 * מאז שהקטגוריות באתר מוצגות כתמונות, קטגוריה בלי תמונה היא פער
 * שצריך לראות ברשימה עצמה, לא לגלות בעמוד הבית.
 */
export function CategoryManager({
  categories, cities,
}: { categories: CategoryRow[]; cities: CityRow[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const parents = categories.filter((c) => !c.parentId);
  const missingImages = categories.filter((c) => !c.imageUrl).length;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (res.ok) onDone?.();
      else setError(res.error ?? "הפעולה נכשלה.");
    });
  }

  function renderCategory(row: CategoryRow, nested = false) {
    const editing = editingId === row.id;

    return (
      <li key={row.id} className={nested ? "" : "border-t border-ink-100 first:border-t-0"}>
        <div className={`flex flex-wrap items-center gap-3 py-2.5 ${nested ? "ps-4" : ""}`}>
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
            {row.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-ink-300">
                <ImageOff className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className={`block truncate ${nested ? "text-sm text-ink-600" : "font-bold text-ink-800"}`}>
              {row.name}
            </span>
            <span className="text-2xs text-ink-400">
              {row.businessCount} עסקים
              {!row.imageUrl && " · חסרה תמונה"}
              {!row.isActive && " · מוסתרת מהאתר"}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <label className="flex items-center gap-1.5 text-2xs font-semibold text-ink-500">
              <input
                type="checkbox"
                checked={row.isActive}
                disabled={pending}
                onChange={(e) => run(() => toggleCategoryActive(row.id, e.target.checked))}
                className="h-3.5 w-3.5 accent-brand-700"
              />
              מוצגת
            </label>
            <button
              type="button"
              onClick={() => setEditingId(editing ? null : row.id)}
              aria-label={`עריכת ${row.name}`}
              aria-expanded={editing}
              className="grid h-8 w-8 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm(`למחוק את "${row.name}"?`)) run(() => deleteCategory(row.id));
              }}
              aria-label={`מחיקת ${row.name}`}
              className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {editing && (
          <form
            action={(fd) => run(() => updateCategory(row.id, fd), () => setEditingId(null))}
            className="mb-3 grid gap-3 rounded-md border border-brand-200 bg-brand-50/40 p-3"
          >
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink-600">שם הקטגוריה</span>
              <input
                name="name"
                defaultValue={row.name}
                className="h-10 rounded-xs border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <ImageUploadField
              name="image"
              label="תמונת הקטגוריה"
              currentUrl={row.imageUrl}
              hint="מוצגת ברצועת עמוד הבית, בתפריט ובעמוד הקטגוריות"
              aspect="3/2"
            />
            <div className="flex gap-2">
              <Button type="submit" variant="primary" size="sm" loading={pending}>שמירה</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingId(null)}>ביטול</Button>
            </div>
          </form>
        )}

        {!nested && (
          <ul>
            {categories.filter((c) => c.parentId === row.id).map((c) => renderCategory(c, true))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">קטגוריות</h2>
              <p className="mt-0.5 text-xs text-ink-400">
                {missingImages > 0
                  ? `${missingImages} קטגוריות עדיין בלי תמונה.`
                  : "לכל הקטגוריות יש תמונה."}
              </p>
            </div>
            {!addingCategory && (
              <Button
                type="button" variant="accent" size="sm"
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setAddingCategory(true)}
              >
                קטגוריה חדשה
              </Button>
            )}
          </div>

          {addingCategory && (
            <form
              action={(fd) => run(() => createCategory(fd), () => setAddingCategory(false))}
              className="mb-5 grid gap-3 rounded-md border border-brand-200 bg-brand-50/40 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink-900">קטגוריה חדשה</h3>
                <button
                  type="button" onClick={() => setAddingCategory(false)} aria-label="סגירה"
                  className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 hover:bg-white"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-ink-600">שם <span className="text-danger-500">*</span></span>
                  <input
                    name="name" required placeholder="למשל: ציוד צילום"
                    className="h-10 rounded-xs border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-400"
                  />
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-ink-600">שיוך</span>
                  <select
                    name="parentId"
                    className="h-10 rounded-xs border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400"
                  >
                    <option value="">קטגוריה ראשית</option>
                    {parents.map((p) => <option key={p.id} value={p.id}>תת-קטגוריה של {p.name}</option>)}
                  </select>
                </label>
              </div>

              <ImageUploadField name="image" label="תמונת הקטגוריה" aspect="3/2" />

              <div>
                <Button type="submit" variant="primary" size="sm" loading={pending}>הוספה</Button>
              </div>
            </form>
          )}

          <ul>{parents.map((p) => renderCategory(p))}</ul>
        </section>

        <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-display text-base font-bold text-ink-900">ערים</h2>

          <form
            action={(fd) => run(() => createCity(fd))}
            className="mb-5 flex flex-wrap gap-2"
          >
            <input
              name="name" placeholder="שם עיר חדשה" required
              aria-label="שם עיר חדשה"
              className="h-10 min-w-0 flex-1 rounded-xs border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
            />
            <Button type="submit" variant="primary" size="sm" loading={pending} icon={<Plus className="h-4 w-4" />}>
              הוספה
            </Button>
          </form>

          <ul className="space-y-0.5">
            {cities.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xs px-2.5 py-2 text-sm hover:bg-ink-50">
                <span className="font-semibold text-ink-700">{c.name}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`למחוק את ${c.name}?`)) run(() => deleteCity(c.id));
                  }}
                  aria-label={`מחיקת ${c.name}`}
                  className="text-ink-300 transition-colors hover:text-danger-500"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
            {cities.length === 0 && (
              <li className="py-6 text-center text-sm text-ink-400">אין עדיין ערים.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
