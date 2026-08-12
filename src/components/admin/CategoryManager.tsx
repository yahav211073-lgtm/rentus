"use client";

import { useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  createCategory, createCity, deleteCategory, deleteCity, toggleCategoryActive,
} from "@/app/admin/categories/actions";

interface CategoryRow { id: string; name: string; parentId: string | null; isActive: boolean }
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

        <form action={submitCategory} className="mb-5 flex flex-wrap gap-2">
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
          <Button type="submit" variant="primary" size="md" loading={pending} icon={<Plus className="h-4 w-4" />}>הוספה</Button>
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
  return (
    <div className={`flex items-center justify-between rounded-xs px-2.5 py-2 text-sm hover:bg-ink-50 ${nested ? "text-ink-600" : "font-bold text-ink-800"}`}>
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
      </label>
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
  );
}
