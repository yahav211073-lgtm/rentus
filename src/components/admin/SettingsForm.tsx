"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateSetting } from "@/app/admin/settings/actions";

interface Props {
  brandIdentity: { name: string; tagline: string; logoUrl: string | null };
  brandColors: { primary: string; secondary: string; accent: string; background: string };
  contactDetails: { phone: string; email: string; address: string; whatsapp: string };
  socialLinks: Record<string, string>;
}

export function SettingsForm({ brandIdentity, brandColors, contactDetails, socialLinks }: Props) {
  return (
    <div className="space-y-6">
      <SettingsSection
        settingKey="brand.identity"
        title="זהות המותג"
        fields={[
          { name: "name", label: "שם האתר", defaultValue: brandIdentity.name },
          { name: "tagline", label: "סלוגן", defaultValue: brandIdentity.tagline },
          { name: "logoUrl", label: "כתובת לוגו (URL)", defaultValue: brandIdentity.logoUrl ?? "" },
        ]}
      />
      <SettingsSection
        settingKey="brand.colors"
        title="צבעי המותג"
        note="הצבעים האלה יזינו את ערכת הנושא של האתר (ייושמו בפועל בעדכון העיצוב הבא)."
        fields={[
          { name: "primary", label: "צבע ראשי", defaultValue: brandColors.primary, type: "color" },
          { name: "secondary", label: "צבע משני", defaultValue: brandColors.secondary, type: "color" },
          { name: "accent", label: "צבע הדגשה", defaultValue: brandColors.accent, type: "color" },
          { name: "background", label: "רקע", defaultValue: brandColors.background, type: "color" },
        ]}
      />
      <SettingsSection
        settingKey="contact.details"
        title="פרטי יצירת קשר"
        note="מספר הוואטסאפ הזה משמש גם באפשרות ׳דברו איתנו בוואטסאפ׳ בעמוד רישום עסק."
        fields={[
          { name: "phone", label: "טלפון", defaultValue: contactDetails.phone },
          { name: "whatsapp", label: "וואטסאפ (בפורמט 972501234567)", defaultValue: contactDetails.whatsapp },
          { name: "email", label: "אימייל", defaultValue: contactDetails.email },
          { name: "address", label: "כתובת", defaultValue: contactDetails.address },
        ]}
      />
      <SettingsSection
        settingKey="social.links"
        title="רשתות חברתיות"
        fields={[
          { name: "facebook", label: "פייסבוק", defaultValue: socialLinks.facebook ?? "" },
          { name: "instagram", label: "אינסטגרם", defaultValue: socialLinks.instagram ?? "" },
          { name: "linkedin", label: "לינקדאין", defaultValue: socialLinks.linkedin ?? "" },
          { name: "tiktok", label: "טיקטוק", defaultValue: socialLinks.tiktok ?? "" },
        ]}
      />
    </div>
  );
}

function SettingsSection({
  settingKey, title, note, fields,
}: {
  settingKey: string;
  title: string;
  note?: string;
  fields: { name: string; label: string; defaultValue: string; type?: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value: Record<string, string> = {};
    fields.forEach((f) => { value[f.name] = String(fd.get(f.name) ?? ""); });

    startTransition(async () => {
      setSaved(false);
      const result = await updateSetting(settingKey, value);
      if (result.ok) setSaved(true);
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-ink-200/70 bg-white p-6">
      <h2 className="mb-1 font-display text-base font-bold text-ink-900">{title}</h2>
      {note && <p className="mb-4 text-xs text-ink-400">{note}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${settingKey}-${f.name}`} className="mb-1.5 block text-xs font-bold text-ink-600">{f.label}</label>
            <input
              id={`${settingKey}-${f.name}`}
              name={f.name}
              type={f.type ?? "text"}
              defaultValue={f.defaultValue}
              className={f.type === "color"
                ? "h-11 w-full rounded-sm border border-ink-200 px-1.5"
                : "h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" variant="primary" size="md" loading={pending} icon={<Save className="h-4 w-4" />}>שמירה</Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" /> נשמר
          </span>
        )}
      </div>
    </form>
  );
}
