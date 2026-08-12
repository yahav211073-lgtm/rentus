"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, ChevronDown, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { updateBusiness } from "@/app/business/dashboard/actions";
import { formatRelative } from "@/lib/utils";
import type { BusinessStatus } from "@/types/domain";

const STATUS_LABEL: Record<BusinessStatus, { label: string; variant: "warning" | "success" | "danger" | "neutral" }> = {
  draft: { label: "טיוטה", variant: "neutral" },
  pending: { label: "ממתין לאישור", variant: "warning" },
  published: { label: "פורסם", variant: "success" },
  rejected: { label: "נדחה", variant: "danger" },
  suspended: { label: "מושעה", variant: "danger" },
  archived: { label: "בארכיון", variant: "neutral" },
};

export interface OwnerBusiness {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  status: BusinessStatus;
  rejectionReason: string | null;
  leads: { id: string; name: string | null; phone: string | null; message: string | null; createdAt: string }[];
}

export function OwnerBusinessCard({ business }: { business: OwnerBusiness }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const status = STATUS_LABEL[business.status];

  function onSubmit(formData: FormData) {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updateBusiness(business.id, formData);
      if (result.ok) {
        setSaved(true);
        setEditing(false);
      } else {
        setError(result.error ?? "השמירה נכשלה.");
      }
    });
  }

  return (
    <section className="rounded-lg border border-ink-200/70 bg-white p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink-900">{business.name}</h2>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {business.status === "pending" && (
            <p className="text-sm text-ink-500">ממתין לבדיקת מנהל — בדרך כלל תוך יום עסקים אחד.</p>
          )}
          {business.status === "rejected" && business.rejectionReason && (
            <p className="text-sm text-danger-500">סיבת הדחייה: {business.rejectionReason}</p>
          )}
        </div>
        <Button
          type="button" variant="secondary" size="sm"
          icon={<Pencil className="h-3.5 w-3.5" />}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "סגירה" : "עריכת פרטים"}
        </Button>
      </div>

      {editing && (
        <form action={onSubmit} className="mb-6 space-y-3.5 border-t border-ink-100 pt-5">
          <div className="grid gap-3.5 sm:grid-cols-2">
            <EditField name="name" label="שם העסק" defaultValue={business.name} required />
            <EditField name="tagline" label="שורת תיאור" defaultValue={business.tagline ?? ""} />
          </div>
          <EditField name="address" label="כתובת" defaultValue={business.address ?? ""} />
          <div className="grid gap-3.5 sm:grid-cols-3">
            <EditField name="phone" label="טלפון" defaultValue={business.phone ?? ""} type="tel" />
            <EditField name="whatsapp" label="וואטסאפ" defaultValue={business.whatsapp ?? ""} type="tel" />
            <EditField name="email" label="אימייל" defaultValue={business.email ?? ""} type="email" />
          </div>
          <EditField name="website" label="אתר" defaultValue={business.website ?? ""} type="url" />
          <div>
            <label className="mb-1.5 block text-xs font-bold text-ink-600">תיאור</label>
            <textarea
              name="description" rows={4} defaultValue={business.description ?? ""}
              className="w-full rounded-sm border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors focus:border-brand-400"
            />
          </div>
          <Button type="submit" variant="primary" size="md" loading={pending}>שמירה</Button>
          {error && <p role="alert" className="text-sm text-danger-500">{error}</p>}
        </form>
      )}

      {saved && (
        <p className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-success-500">
          <CheckCircle2 className="h-4 w-4" /> נשמר בהצלחה
        </p>
      )}

      <LeadsSection leads={business.leads} />
    </section>
  );
}

function LeadsSection({ leads }: { leads: OwnerBusiness["leads"] }) {
  const [open, setOpen] = useState(false);

  if (leads.length === 0) {
    return <p className="text-sm text-ink-400">עדיין לא התקבלו פניות.</p>;
  }

  return (
    <div className="border-t border-ink-100 pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-bold text-ink-700"
      >
        <span>{leads.length} פניות התקבלו</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul className="mt-3 divide-y divide-ink-100">
          {leads.map((l) => (
            <li key={l.id} className="py-3 text-sm">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="font-bold text-ink-800">{l.name ?? "ללא שם"}</span>
                <span className="text-2xs text-ink-400">{formatRelative(l.createdAt)}</span>
              </div>
              {l.phone && <p className="text-ink-500">{l.phone}</p>}
              {l.message && <p className="mt-1 text-ink-600">{l.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EditField({
  name, label, defaultValue, type = "text", required,
}: { name: string; label: string; defaultValue: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={`edit-${name}`} className="mb-1.5 block text-xs font-bold text-ink-600">{label}</label>
      <input
        id={`edit-${name}`}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none transition-colors focus:border-brand-400"
      />
    </div>
  );
}
