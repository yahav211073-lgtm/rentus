"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createBusinessAdmin } from "@/app/admin/businesses/actions";
import type { FlatCategory } from "@/lib/repo/taxonomy";

export function NewBusinessForm({ categories }: { categories: FlatCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (k: string) => (fd.get(k) ? String(fd.get(k)) : null);
    const coverFile = fd.get("cover") as File | null;

    if (!coverFile || coverFile.size === 0) {
      setError("תמונת שער היא שדה חובה.");
      return;
    }

    startTransition(async () => {
      setError("");
      const result = await createBusinessAdmin({
        name: String(fd.get("name")),
        tagline: val("tagline"),
        description: val("description"),
        address: val("address"),
        phone: val("phone"),
        whatsapp: val("whatsapp"),
        email: val("email"),
        categoryId: val("category"),
        coverFile,
      });
      if (result.ok) {
        router.push(`/admin/businesses/${result.businessId}`);
      } else {
        setError(result.error ?? "השמירה נכשלה.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4 border border-ink-200/70 bg-white p-6">
      <p className="mb-2 text-sm text-ink-500">
        הטופס הזה יוצר עסק שמפורסם באתר מיד. שימוש טיפוסי: התקשרתם עם לקוח שפנה, ואתם בונים לו את הפרופיל.
      </p>

      <div>
        <label htmlFor="new-cover" className="mb-1.5 block text-xs font-bold text-ink-600">
          תמונת שער <span className="text-danger-500">*</span>
        </label>
        <label
          htmlFor="new-cover"
          className="flex h-36 cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-200 bg-ink-50 text-ink-400 transition-colors hover:border-brand-300 hover:bg-brand-50"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!coverPreview && (
            <>
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm font-semibold">העלאת תמונת שער</span>
            </>
          )}
        </label>
        <input
          id="new-cover" name="cover" type="file" accept="image/*" required
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setCoverPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="name" label="שם העסק" required />
        <Field name="tagline" label="שורת תיאור קצרה" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-bold text-ink-600">תיאור</label>
        <textarea name="description" rows={3} className="w-full border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none focus:border-brand-400" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="address" label="כתובת" />
        <div>
          <label htmlFor="new-business-category" className="mb-1.5 block text-xs font-bold text-ink-600">קטגוריה</label>
          <select
            id="new-business-category" name="category"
            className="h-11 w-full border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
          >
            <option value="">בחרו קטגוריה</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field name="phone" label="טלפון" type="tel" />
        <Field name="whatsapp" label="וואטסאפ" type="tel" />
        <Field name="email" label="אימייל" type="email" />
      </div>

      <Button type="submit" variant="primary" size="lg" loading={pending} icon={<Save className="h-4.5 w-4.5" />}>
        יצירת העסק
      </Button>
      {error && <p role="alert" className="text-sm text-danger-500">{error}</p>}
      {pending && (
        <p className="flex items-center gap-1.5 text-sm text-ink-400">
          <CheckCircle2 className="h-4 w-4" /> שומר...
        </p>
      )}
    </form>
  );
}

function Field({
  name, label, type = "text", required,
}: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={`new-${name}`} className="mb-1.5 block text-xs font-bold text-ink-600">{label}</label>
      <input
        id={`new-${name}`} name={name} type={type} required={required}
        className="h-11 w-full border border-ink-200 px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
      />
    </div>
  );
}
