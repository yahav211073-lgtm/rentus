"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { updateBrandIdentity, updateSetting, updateSocialLinks } from "@/app/admin/settings/actions";

interface Props {
  brandIdentity: { name: string; tagline: string; logoUrl: string | null; heroImageUrl: string | null };
  brandColors: { primary: string; secondary: string; accent: string; background: string };
  contactDetails: { phone: string; email: string; address: string; whatsapp: string };
  socialLinks: Record<string, string>;
  aboutContent: { intro: string; points: { title: string; body: string }[] };
}

/**
 * הגדרות האתר.
 *
 * כל בלוק נשמר בנפרד ומראה אישור משלו. טופס אחד ענק עם כפתור שמירה
 * יחיד גורם למנהל להסס לפני כל שינוי קטן, כי הוא לא בטוח מה עוד
 * ייכתב יחד איתו.
 */
export function SettingsForm({ brandIdentity, brandColors, contactDetails, socialLinks, aboutContent }: Props) {
  return (
    <div className="space-y-6">
      <BrandIdentitySection identity={brandIdentity} />
      <AboutContentSection content={aboutContent} />

      <SettingsSection
        settingKey="brand.colors"
        title="צבעי המותג"
        note="הצבעים נכתבים כמשתני CSS על תגית ה-HTML ודורסים את ערכת ברירת המחדל. השינוי נראה באתר מיד אחרי השמירה."
        fields={[
          { name: "primary", label: "צבע ראשי", defaultValue: brandColors.primary, type: "color" },
          { name: "secondary", label: "צבע משני", defaultValue: brandColors.secondary, type: "color" },
          { name: "accent", label: "צבע הדגשה (כפתורי פעולה)", defaultValue: brandColors.accent, type: "color" },
          { name: "background", label: "רקע רצועות", defaultValue: brandColors.background, type: "color" },
        ]}
      />

      <SettingsSection
        settingKey="contact.details"
        title="פרטי יצירת קשר"
        note="הטלפון מופיע ברצועה העליונה, והוואטסאפ משמש בכפתורי הפנייה. פורמט מומלץ לוואטסאפ: 9725XXXXXXXX."
        fields={[
          { name: "phone", label: "טלפון", defaultValue: contactDetails.phone },
          { name: "whatsapp", label: "וואטסאפ", defaultValue: contactDetails.whatsapp },
          { name: "email", label: "אימייל", defaultValue: contactDetails.email, type: "email" },
          { name: "address", label: "כתובת", defaultValue: contactDetails.address },
        ]}
      />

      <SocialLinksSection links={socialLinks} />
    </div>
  );
}

function AboutContentSection({ content }: { content: Props["aboutContent"] }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value = {
      intro: String(fd.get("intro") ?? "").trim(),
      points: [0, 1, 2, 3].map((i) => ({
        title: String(fd.get(`point-${i}-title`) ?? "").trim(),
        body: String(fd.get(`point-${i}-body`) ?? "").trim(),
      })),
    };

    startTransition(async () => {
      setSaved(false);
      setError(null);
      const result = await updateSetting("about.content", value);
      if (result.ok) setSaved(true);
      else setError(result.error ?? "השמירה נכשלה.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-ink-200/70 bg-white p-6">
      <h2 className="mb-1 font-display text-base text-ink-900">עמוד אודות</h2>
      <p className="mb-4 text-xs text-ink-400">
        הטקסט המרכזי ו-4 נקודות החוזק שמוצגות בעמוד /about.
      </p>

      <label className="mb-4 flex flex-col gap-1.5">
        <span className="text-xs font-bold text-ink-600">פסקת פתיחה</span>
        <textarea
          name="intro"
          rows={3}
          defaultValue={content.intro}
          className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors focus:border-brand-400"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        {content.points.map((p, i) => (
          <div key={i} className="rounded-xs border border-ink-100 p-3.5">
            <label className="mb-2 flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink-600">כותרת נקודה {i + 1}</span>
              <input
                name={`point-${i}-title`}
                defaultValue={p.title}
                className="h-10 w-full rounded-xs border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-ink-600">טקסט</span>
              <textarea
                name={`point-${i}-body`}
                rows={2}
                defaultValue={p.body}
                className="w-full rounded-xs border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
            </label>
          </div>
        ))}
      </div>

      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
  );
}

function BrandIdentitySection({ identity }: { identity: Props["brandIdentity"] }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setSaved(false);
          setError(null);
          const res = await updateBrandIdentity(fd);
          if (res.ok) setSaved(true);
          else setError(res.error ?? "השמירה נכשלה.");
        })
      }
      className="rounded-lg border border-ink-200/70 bg-white p-6"
    >
      <h2 className="mb-1 font-display text-base text-ink-900">זהות המותג</h2>
      <p className="mb-4 text-xs text-ink-400">
        השם והסלוגן מופיעים בכותרת האתר, בכותרת הדפדפן ובתגיות השיתוף.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-600">שם האתר <span className="text-danger-500">*</span></span>
          <input
            name="name"
            defaultValue={identity.name}
            required
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-ink-600">סלוגן</span>
          <input
            name="tagline"
            defaultValue={identity.tagline}
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </label>

        <ImageUploadField
          name="logo"
          label="לוגו האתר"
          currentUrl={identity.logoUrl}
          hint="PNG שקוף מומלץ · יוצג בגובה 40 פיקסלים"
          aspect="5/2"
          className="sm:col-span-2"
        />

        <ImageUploadField
          name="hero"
          label="תמונת רקע להירו (עמוד הבית)"
          currentUrl={identity.heroImageUrl}
          hint="JPG או WebP רחב מומלץ · מוצג מאחורי הכותרת בעמוד הבית"
          aspect="16/9"
          className="sm:col-span-2"
        />
      </div>

      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
  );
}

function SocialLinksSection({ links }: { links: Record<string, string> }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fields = [
    { name: "facebook", label: "פייסבוק" },
    { name: "instagram", label: "אינסטגרם" },
    { name: "linkedin", label: "לינקדאין" },
    { name: "tiktok", label: "טיקטוק" },
    { name: "youtube", label: "יוטיוב" },
  ];

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setSaved(false);
          setError(null);
          const res = await updateSocialLinks(fd);
          if (res.ok) setSaved(true);
          else setError(res.error ?? "השמירה נכשלה.");
        })
      }
      className="rounded-lg border border-ink-200/70 bg-white p-6"
    >
      <h2 className="mb-1 font-display text-base text-ink-900">רשתות חברתיות</h2>
      <p className="mb-4 text-xs text-ink-400">
        רשת שנשארת ריקה פשוט לא מוצגת בפוטר — לא יוצג אייקון מת.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <label key={f.name} className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-ink-600">{f.label}</span>
            <input
              name={f.name}
              type="url"
              inputMode="url"
              dir="ltr"
              placeholder="https://"
              defaultValue={links[f.name] ?? ""}
              className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
            />
          </label>
        ))}
      </div>

      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
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
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const value: Record<string, string> = {};
    fields.forEach((f) => { value[f.name] = String(fd.get(f.name) ?? ""); });

    startTransition(async () => {
      setSaved(false);
      setError(null);
      const result = await updateSetting(settingKey, value);
      if (result.ok) setSaved(true);
      else setError(result.error ?? "השמירה נכשלה.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-ink-200/70 bg-white p-6">
      <h2 className="mb-1 font-display text-base text-ink-900">{title}</h2>
      {note && <p className="mb-4 text-xs text-ink-400">{note}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={f.name}>
            <label htmlFor={`${settingKey}-${f.name}`} className="mb-1.5 block text-xs font-bold text-ink-600">
              {f.label}
            </label>
            {f.type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  id={`${settingKey}-${f.name}`}
                  name={f.name}
                  type="color"
                  defaultValue={f.defaultValue}
                  className="h-11 w-16 shrink-0 cursor-pointer rounded-xs border border-ink-200 bg-white p-1"
                />
                <span dir="ltr" className="font-mono text-xs text-ink-400">{f.defaultValue}</span>
              </div>
            ) : (
              <input
                id={`${settingKey}-${f.name}`}
                name={f.name}
                type={f.type ?? "text"}
                defaultValue={f.defaultValue}
                className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
              />
            )}
          </div>
        ))}
      </div>

      <SaveRow pending={pending} saved={saved} error={error} />
    </form>
  );
}

function SaveRow({
  pending, saved, error,
}: { pending: boolean; saved: boolean; error: string | null }) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <Button type="submit" variant="primary" size="md" loading={pending} icon={<Save className="h-4 w-4" />}>
        שמירה
      </Button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> נשמר והוחל באתר
        </span>
      )}
      {error && (
        <span role="alert" className="text-sm font-semibold text-danger-500">{error}</span>
      )}
    </div>
  );
}
