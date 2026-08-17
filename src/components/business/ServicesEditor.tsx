"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateBusinessServices } from "@/app/business/dashboard/actions";
import type { BusinessService } from "@/types/domain";

interface Row {
  key: string;
  name: string;
  description: string;
  price: string;
  priceUnit: string;
}

let nextKey = 0;
function toRows(services: BusinessService[]): Row[] {
  return services.map((s) => ({
    key: s.id,
    name: s.name,
    description: s.description ?? "",
    price: s.price != null ? String(s.price) : "",
    priceUnit: s.priceUnit ?? "",
  }));
}

/**
 * עריכת שירותים ומחירון. שמירה שולחת את כל הרשימה יחד
 * (updateBusinessServices מוחקת ומכניסה מחדש) — פשוט יותר מלעקוב
 * אחרי מזהי שורות שנמחקו/נוספו בצד הלקוח.
 */
export function ServicesEditor({ businessId, services }: { businessId: string; services: BusinessService[] }) {
  const [rows, setRows] = useState<Row[]>(() => toRows(services));
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setSaved(false);
  }

  function addRow() {
    setRows((prev) => [...prev, { key: `new-${nextKey++}`, name: "", description: "", price: "", priceUnit: "" }]);
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateBusinessServices(
        businessId,
        rows.map((r) => ({
          name: r.name,
          description: r.description || null,
          price: r.price ? Number(r.price) : null,
          priceUnit: r.priceUnit || null,
        })),
      );
      if (result.ok) setSaved(true);
      else setError(result.error ?? "השמירה נכשלה.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="grid gap-2 rounded-xs border border-ink-100 p-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
          <input
            value={row.name}
            onChange={(e) => update(row.key, { name: e.target.value })}
            placeholder="שם השירות"
            aria-label="שם השירות"
            className="h-9 rounded-xs border border-ink-200 px-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={row.description}
            onChange={(e) => update(row.key, { description: e.target.value })}
            placeholder="תיאור קצר (אופציונלי)"
            aria-label="תיאור השירות"
            className="h-9 rounded-xs border border-ink-200 px-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={row.price}
            onChange={(e) => update(row.key, { price: e.target.value })}
            type="number" min="0" step="0.01"
            placeholder="מחיר"
            aria-label="מחיר"
            className="h-9 w-24 rounded-xs border border-ink-200 px-2.5 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={row.priceUnit}
            onChange={(e) => update(row.key, { priceUnit: e.target.value })}
            placeholder="יחידה (לשעה, ליום...)"
            aria-label="יחידת מחיר"
            className="h-9 w-32 rounded-xs border border-ink-200 px-2.5 text-sm outline-none focus:border-brand-400"
          />
          <button
            type="button"
            onClick={() => removeRow(row.key)}
            aria-label="הסרת שירות"
            className="grid h-9 w-9 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="flex items-center gap-1.5 rounded-xs border border-dashed border-ink-300 px-3 py-2 text-sm font-bold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
      >
        <Plus className="h-4 w-4" /> הוספת שירות
      </button>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button type="submit" variant="secondary" size="sm" loading={pending}>שמירת שירותים</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" /> נשמר
          </span>
        )}
        {error && <span role="alert" className="text-sm font-semibold text-danger-500">{error}</span>}
      </div>
    </form>
  );
}
