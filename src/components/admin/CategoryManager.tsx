"use client";

import { useState, useTransition } from "react";
import { ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createCategory, createCity, deleteCategory, deleteCity, toggleCategoryActive, updateCategoryImage,
} from "@/app/admin/categories/actions";

interface CategoryRow { id: string; name: string; parentId: string | null; isActive: boolean; imageUrl: string | null }
interface CityRow { id: string; name: string }

export function CategoryManager({ categories, cities }: { categories: CategoryRow[]; cities: CityRow[] }) {
  const [pending, startTransition] = useTransition();
  const parents = categories.filter((c) => !c.parentId);

  function submitCategory(formData: FormData) {
    startTransition(async () => { await createCategory(formData); });
  }

  function submitCity(formData: FormData) {
    startTransition(async () => { await createCity(formData); });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-4 font-display text-base font-bold text-ink-900">קטגוריות</h2>

        <form action={submitCategory} className="mb-5 grid gap-2" encType="multipart/form-data">
          <div className="flex flex-wrap gap-2">
            <input
              name="name" placeholder="שם קטגוריה חדשה" required
              className="h-10 min-w-0 flex-1 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
            />
            <select
              name="parentId"
              className="h-10 rounded-sm border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400"
            >
              <option value="">קטגוריית-על</option>
              {parents.map((p) => <option key={p.id} value={p.id}>תת של {p.name}</option>)}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex h-10 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-sm border border-dashed border-ink-300 bg-white px-3 text-sm text-ink-600 transition-colors hover:border-brand-400 hover:bg-brand-50">
              <Upload className="h-4 w-4 text-brand-700" />
              <span>העלאת תמונה מהמכשיר</span>
              <input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" />
            </label>
            <input
              name="imageUrl" placeholder="או כתובת תמונה קיימת (לא חובה)"
              className="h-10 min-w-0 flex-1 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
            />
            <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>הוספה</Button>
          </div>
        </form>

        <ul className="space-y-1">
          {parents.map((p) => (
            <li key={p.id}>
              <CategoryItem row={p} pending={pending} startTransition={startTransition} />
              <ul className="mr-5 mt-1 space-y-1 border-e border-ink-100 pe-0">
                {categories.filter((c) => c.parentId === p.id).map((c) => (
                  <CategoryItem key={c.id} row={c} pending={pending} startTransition={startTransition} nested />
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-4 font-display text-base font-bold text-ink-900">ערים</h2>

        <form action={submitCity} className="mb-5 flex flex-wrap gap-2">
          <input
            name="name" placeholder="שם עיר חדשה" required
            className="h-10 min-w-0 flex-1 rounded-sm border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>הוספה</Button>
        </form>

        <ul className="space-y-1">
          {cities.map((c) => (
            <li key={c.id} className="flex items-center justify-between rounded-xs px-2.5 py-2 text-sm hover:bg-ink-50">
              <span className="font-semibold text-ink-700">{c.name}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (confirm(`למחוק את ${c.name}? זה ישפיע על כל עסק שמשויך אליה.`)) {
                    startTransition(async () => { await deleteCity(c.id); });
                  }
                }}
                className="text-ink-300 transition-colors hover:text-danger-500"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function CategoryItem({
  row, pending, startTransition, nested,
}: {
  row: CategoryRow;
  pending: boolean;
  startTransition: (fn: () => Promise<void> | void) => void;
  nested?: boolean;
}) {
  const [editingImage, setEditingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState(row.imageUrl ?? "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  return (
    <div className="rounded-xs hover:bg-ink-50">
      <div className={`flex items-center justify-between px-2.5 py-2 text-sm ${nested ? "text-ink-600" : "font-bold text-ink-800"}`}>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.isActive}
            disabled={pending}
            onChange={(e) => startTransition(async () => { await toggleCategoryActive(row.id, e.target.checked); })}
            className="h-3.5 w-3.5 accent-brand-700"
          />
          {row.name}
          {!row.isActive && <span className="text-2xs text-ink-400">(מוסתר)</span>}
          {row.imageUrl && <span className="text-2xs text-success-500">(עם תמונה)</span>}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditingImage((v) => !v)}
            className="text-ink-300 transition-colors hover:text-brand-700"
            aria-label="עריכת תמונת קטגוריה"
          >
            <ImageIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(`למחוק את ${row.name}? זה ישפיע על כל עסק שמשויך אליה.`)) {
                startTransition(async () => { await deleteCategory(row.id); });
              }
            }}
            className="text-ink-300 transition-colors hover:text-danger-500"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {editingImage && (
        <div className="grid gap-2 px-2.5 pb-2.5 sm:grid-cols-[auto_1fr_auto]">
          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-dashed border-ink-300 px-2 text-xs font-semibold text-brand-700 hover:bg-brand-50">
            <Upload className="h-3.5 w-3.5" />
            {imageFile ? imageFile.name : "העלאת תמונה"}
            <input
              type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="או כתובת תמונה קיימת"
            className="h-8 min-w-0 rounded-sm border border-ink-200 px-2 text-xs outline-none focus:border-brand-400"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(async () => {
              const formData = new FormData();
              formData.set("imageUrl", imageUrl);
              if (imageFile) formData.set("image", imageFile);
              await updateCategoryImage(row.id, formData);
              setEditingImage(false);
            })}
            className="rounded-sm bg-brand-800 px-3 text-xs font-bold text-white hover:bg-brand-700"
          >
            שמירה
          </button>
        </div>
      )}
    </div>
  );
}
