"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateBusinessAdmin } from "@/app/admin/businesses/actions";
import type { FlatCategory } from "@/lib/repo/taxonomy";

export interface AdminBusinessDetail {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  status: string;
  tier: string;
  isFeatured: boolean;
  isSponsored: boolean;
  isVerified: boolean;
  boostScore: number;
  primaryCategoryId: string | null;
}

const STATUSES = [
  { value: "draft", label: "טיוטה" },
  { value: "pending", label: "ממתין לאישור" },
  { value: "published", label: "פורסם" },
  { value: "rejected", label: "נדחה" },
  { value: "suspended", label: "מושעה" },
  { value: "archived", label: "בארכיון" },
];

const TIERS = [
  { value: "free", label: "חינם" },
  { value: "basic", label: "בסיסי" },
  { value: "premium", label: "פרימיום" },
  { value: "enterprise", label: "עסקי" },
];

export function BusinessAdminForm({ business, categories }: { business: AdminBusinessDetail; categories: FlatCategory[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const val = (k: string) => (fd.get(k) ? String(fd.get(k)) : null);

    startTransition(async () => {
      setError("");
      const result = await updateBusinessAdmin(business.id, {
        name: String(fd.get("name")),
        tagline: val("tagline"),
        description: val("description"),
        address: val("address"),
        latitude: fd.get("latitude") ? Number(fd.get("latitude")) : null,
        longitude: fd.get("longitude") ? Number(fd.get("longitude")) : null,
        phone: val("phone"),
        whatsapp: val("whatsapp"),
        email: val("email"),
        website: val("website"),
        status: String(fd.get("status")),
        tier: String(fd.get("tier")),
        isFeatured: fd.get("isFeatured") === "on",
        isSponsored: fd.get("isSponsored") === "on",
        isVerified: fd.get("isVerified") === "on",
        boostScore: Number(fd.get("boostScore") ?? 0),
        categoryId: val("category"),
      });
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error ?? "השמירה נכשלה.");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-4 font-display text-base font-bold text-ink-900">פרטים כלליים</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="name" label="שם העסק" defaultValue={business.name} required />
          <TextField name="tagline" label="שורת תיאור" defaultValue={business.tagline ?? ""} />
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-xs font-bold text-ink-600">תיאור</label>
          <textarea
            name="description" rows={4} defaultValue={business.description ?? ""}
            className="w-full rounded-sm border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none focus:border-brand-400"
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField name="address" label="כתובת" defaultValue={business.address ?? ""} />
          <div>
            <label htmlFor="admin-category" className="mb-1.5 block text-xs font-bold text-ink-600">קטגוריה ראשית</label>
            <select
              id="admin-category" name="category" defaultValue={business.primaryCategoryId ?? ""}
              className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
            >
              <option value="">ללא</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <TextField name="phone" label="טלפון" defaultValue={business.phone ?? ""} type="tel" />
          <TextField name="whatsapp" label="וואטסאפ" defaultValue={business.whatsapp ?? ""} type="tel" />
          <TextField name="email" label="אימייל" defaultValue={business.email ?? ""} type="email" />
        </div>
        <div className="mt-4">
          <TextField name="website" label="אתר" defaultValue={business.website ?? ""} type="url" />
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold text-ink-600">מיקום במפה</p>
          <div className="grid gap-2.5 sm:grid-cols-3">
            <TextField name="latitude" label="קו רוחב (latitude)" defaultValue={business.latitude != null ? String(business.latitude) : ""} type="number" step="any" />
            <TextField name="longitude" label="קו אורך (longitude)" defaultValue={business.longitude != null ? String(business.longitude) : ""} type="number" step="any" />
            <a
              href={`https://nominatim.openstreetmap.org/ui/search.html?q=${encodeURIComponent(business.address ?? business.name)}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-6 self-start text-xs font-bold text-brand-700 hover:text-brand-500"
            >
              חיפוש קואורדינטות לפי כתובת ←
            </a>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-ink-200/70 bg-white p-6">
        <h2 className="mb-4 font-display text-base font-bold text-ink-900">סטטוס וקידום (ניהול בלבד)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="admin-status" className="mb-1.5 block text-xs font-bold text-ink-600">סטטוס</label>
            <select
              id="admin-status" name="status" defaultValue={business.status}
              className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
            >
              {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="admin-tier" className="mb-1.5 block text-xs font-bold text-ink-600">מסלול</label>
            <select
              id="admin-tier" name="tier" defaultValue={business.tier}
              className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
            >
              {TIERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <TextField name="boostScore" label="ציון קידום (0-100)" defaultValue={String(business.boostScore)} type="number" min={0} max={100} />
        </div>
        <div className="mt-4 flex flex-wrap gap-5">
          <Checkbox name="isFeatured" label="מומלץ" defaultChecked={business.isFeatured} />
          <Checkbox name="isSponsored" label="ממומן" defaultChecked={business.isSponsored} />
          <Checkbox name="isVerified" label="מאומת" defaultChecked={business.isVerified} />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" size="lg" loading={pending} icon={<Save className="h-4.5 w-4.5" />}>
          שמירה
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" /> נשמר
          </span>
        )}
        {error && <span className="text-sm text-danger-500">{error}</span>}
      </div>
    </form>
  );
}

function TextField({
  name, label, defaultValue, type = "text", required, ...rest
}: {
  name: string; label: string; defaultValue: string; type?: string; required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={`admin-${name}`} className="mb-1.5 block text-xs font-bold text-ink-600">{label}</label>
      <input
        id={`admin-${name}`} name={name} type={type} required={required} defaultValue={defaultValue}
        className="h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}

function Checkbox({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4 rounded-xs border-ink-300 accent-brand-700" />
      {label}
    </label>
  );
}
