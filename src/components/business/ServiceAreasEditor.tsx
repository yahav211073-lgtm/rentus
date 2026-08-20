"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateServiceAreas } from "@/app/business/dashboard/actions";
import type { SimpleArea } from "@/lib/repo/taxonomy";

/**
 * אזורי שירות.
 *
 * צ'קבוקסים ולא רשימת בחירה מרובה: מספר האזורים בישראל קטן, וכל
 * האפשרויות נכנסות למסך בבת אחת. `<select multiple>` מסתיר את
 * מרביתן מאחורי גלילה, ובמובייל הוא פשוט לא שמיש.
 *
 * זה השדה שהכי חסר בפרופילים היום, והוא אחד מהתנאים לסימון עסק
 * כמאומת — ראו lib/verification.ts.
 */
export function ServiceAreasEditor({
  businessId, areas, selected,
}: {
  businessId: string;
  areas: SimpleArea[];
  selected: string[];
}) {
  const [ids, setIds] = useState<string[]>(selected);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function toggle(id: string) {
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setSaved(false);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {areas.map((a) => {
          const active = ids.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a.id)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition-colors ${
                active
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-ink-200 bg-white text-ink-500 hover:border-brand-300 hover:text-brand-700"
              }`}
            >
              {a.name}
            </button>
          );
        })}
      </div>

      {areas.length === 0 && (
        <p className="text-sm text-ink-400">לא הוגדרו אזורים במערכת.</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="md"
          loading={pending}
          onClick={() =>
            startTransition(async () => {
              setError("");
              const res = await updateServiceAreas(businessId, ids);
              if (res.ok) setSaved(true);
              else setError(res.error ?? "השמירה נכשלה.");
            })
          }
        >
          שמירת אזורי שירות
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> נשמר
          </span>
        )}
        {error && <span role="alert" className="text-sm font-semibold text-danger-500">{error}</span>}
      </div>
    </div>
  );
}
