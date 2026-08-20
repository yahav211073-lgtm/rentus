"use client";

import { HoursFieldset } from "@/components/business/HoursFieldset";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { createBusinessAdmin } from "@/app/admin/businesses/actions";
import type { FlatCategory, SimpleCity } from "@/lib/repo/taxonomy";

/**
 * הוספת עסק ידנית מהניהול.
 *
 * הטופס נשלח כ-FormData ישירות ל-Server Action, והוולידציה של
 * התמונה (סוג, גודל) קורית בשרת. גרסה קודמת בנתה אובייקט ידנית
 * והעלתה את הקובץ בלי בדיקה — כלומר כל קובץ שהמשתמש בחר, בכל גודל,
 * נכנס לאחסון.
 */
export function NewBusinessForm({
  categories, cities,
}: { categories: FlatCategory[]; cities: SimpleCity[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError("");
          const result = await createBusinessAdmin(fd);
          if (result.ok && result.businessId) router.push(`/admin/businesses/${result.businessId}`);
          else setError(result.error ?? "השמירה נכשלה.");
        })
      }
      className="max-w-2xl space-y-4 rounded-lg border border-ink-200/70 bg-white p-6"
    >
      <p className="text-sm text-ink-500">
        הטופס יוצר עסק שמפורסם באתר מיד. שימוש טיפוסי: דיברתם בטלפון עם לקוח שפנה, ואתם בונים
        לו את הפרופיל בעצמכם.
      </p>

      {/* הלוגו הוא שדה החובה — הוא מזהה את העסק בכל כרטיס באתר,
          ואין לו יותר גיבוי. תמונת השער אופציונלית. */}
      <ImageUploadField
        name="logo"
        label="לוגו"
        required
        aspect="1/1"
        hint="הסמל שיופיע בכל כרטיס של העסק באתר. עדיף PNG עם רקע שקוף."
      />

      <ImageUploadField
        name="cover"
        label="תמונת שער (לא חובה)"
        hint="התמונה הרחבה בראש עמוד העסק"
      />

      <p className="rounded-xs border border-ink-200 bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">
        העסק ייווצר כ<strong>מפורסם ומאומת</strong>. פרטים נוספים אפשר להשלים
        לאחר היצירה במסך העריכה.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="שם העסק" required />
        <Field name="tagline" label="שורת תיאור קצרה" />
      </div>

      <div>
        <label htmlFor="new-description" className="mb-1.5 block text-xs font-bold text-ink-600">תיאור</label>
        <textarea
          id="new-description" name="description" rows={3}
          className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base outline-none focus:border-brand-400"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="address" label="כתובת" />
        <div>
          <label htmlFor="new-city" className="mb-1.5 block text-xs font-bold text-ink-600">עיר</label>
          <select
            id="new-city" name="cityId"
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
          >
            <option value="">ללא</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="new-category" className="mb-1.5 block text-xs font-bold text-ink-600">קטגוריה</label>
        <select
          id="new-category" name="categoryId"
          className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
        >
          <option value="">בחרו קטגוריה</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="phone" label="טלפון" type="tel" />
        <Field name="whatsapp" label="וואטסאפ" type="tel" />
        <Field name="email" label="אימייל" type="email" />
      </div>

      {/* שעות פעילות בטופס היצירה ולא רק במסך העריכה: הן אחד
          התנאים לאימות, ובלעדיהן כל עסק שנוצר מהניהול היה נשאר
          לא-מאומת עד שמישהו חוזר ופותח אותו שוב. */}
      <HoursFieldset />

      <Button type="submit" variant="primary" size="lg" loading={pending} icon={<Save className="h-4.5 w-4.5" />}>
        יצירת העסק
      </Button>
      {error && <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>}
    </form>
  );
}

function Field({
  name, label, type = "text", required,
}: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={`new-${name}`} className="mb-1.5 block text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      <input
        id={`new-${name}`} name={name} type={type} required={required}
        className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
      />
    </div>
  );
}
