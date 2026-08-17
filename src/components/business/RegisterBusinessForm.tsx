"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { submitBusinessRequest } from "@/app/business/register/actions";
import type { FlatCategory, SimpleCity } from "@/lib/repo/taxonomy";

interface Props {
  categories: FlatCategory[];
  cities: SimpleCity[];
}

/**
 * טופס בקשה להוספת עסק.
 *
 * הטופס נשלח כ-FormData ל-Server Action, שם נבדקים גם הקובץ (סוג
 * וגודל) וגם השדות. בגרסה הקודמת ההעלאה נעשתה מהדפדפן עם
 * accept="image/*" בלבד — כלומר כל קובץ, בכל גודל, נכנס לאחסון.
 * ולידציה בדפדפן היא נוחות; ולידציה בשרת היא ההגנה.
 */
export function RegisterBusinessForm({ categories, cities }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  if (done) {
    return (
      <section className="rounded-lg border border-success-500/30 bg-success-50 p-7 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-11 w-11 text-success-500" aria-hidden="true" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">הבקשה נשלחה</h2>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-600">
          הבקשה נכנסה לתור האישור של הצוות, בדרך כלל תוך יום עסקים אחד. תקבלו התראה באתר
          ברגע שתתקבל החלטה, ותוכלו לעקוב אחרי הסטטוס מ־
          <Link href="/business/dashboard" className="font-bold text-brand-700 hover:text-brand-500">
            אזור בעלי החברות
          </Link>.
        </p>
      </section>
    );
  }

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError("");
          const res = await submitBusinessRequest(fd);
          if (res.ok) {
            setDone(true);
            router.refresh();
          } else {
            setError(res.error);
          }
        })
      }
      className="space-y-5 rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6"
    >
      <ImageUploadField
        name="cover"
        label="תמונה ראשית של החברה"
        required
        hint="התמונה שתופיע בראש עמוד החברה ובכרטיס שלה ברשימות"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-name" name="name" label="שם החברה" required />
        <Field id="reg-tagline" name="tagline" label="שורת תיאור קצרה" placeholder="במה אתם מתמחים?" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-category" className="mb-1.5 block text-xs font-bold text-ink-600">
            קטגוריה <span className="text-danger-500">*</span>
          </label>
          <select
            id="reg-category" name="category" required
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
          >
            <option value="">בחרו קטגוריה</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.parentId ? `— ${c.name}` : c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reg-city" className="mb-1.5 block text-xs font-bold text-ink-600">עיר</label>
          <select
            id="reg-city" name="city"
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3.5 text-base outline-none focus:border-brand-400"
          >
            <option value="">בחרו עיר</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <Field id="reg-address" name="address" label="כתובת" placeholder="רחוב ומספר" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="reg-phone" name="phone" label="טלפון" type="tel" inputMode="tel" placeholder="050-0000000" />
        <Field id="reg-whatsapp" name="whatsapp" label="וואטסאפ" type="tel" inputMode="tel" placeholder="050-0000000" />
        <Field id="reg-email" name="email" label="אימייל" type="email" />
      </div>
      <p className="-mt-3 text-2xs text-ink-400">צריך טלפון או וואטסאפ אחד לפחות כדי שנוכל לחזור אליכם.</p>

      <div>
        <label htmlFor="reg-description" className="mb-1.5 block text-xs font-bold text-ink-600">תיאור החברה</label>
        <textarea
          id="reg-description" name="description" rows={4}
          className="w-full rounded-xs border border-ink-200 px-3.5 py-2.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
          placeholder="במה אתם עוסקים, מה מייחד אתכם, אזורי שירות"
        />
      </div>

      <Button
        type="submit" variant="accent" size="lg" fullWidth
        loading={pending}
        icon={<Send className="h-4.5 w-4.5" />}
      >
        שליחת הבקשה לאישור
      </Button>

      {error && <p role="alert" className="text-sm font-semibold text-danger-500">{error}</p>}
    </form>
  );
}

function Field({
  id, name, label, type = "text", required, ...rest
}: {
  id: string; name: string; label: string; type?: string; required?: boolean;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
