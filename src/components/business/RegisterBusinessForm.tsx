"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { FlatCategory, SimpleCity } from "@/lib/repo/taxonomy";

interface Props {
  categories: FlatCategory[];
  cities: SimpleCity[];
}

/**
 * שלוש כתיבות ל-DB ברצף: business (status='pending', owner_id=עצמי —
 * נאכף ב-RLS מ-0011), ואז business_categories לקטגוריה שנבחרה.
 * אם השלב השני נכשל העסק כבר נוצר בכל זאת — עדיף עסק בלי קטגוריה
 * שאפשר לתקן בניהול, מאשר לאבד את כל הטופס ולבקש מהמשתמש למלא שוב.
 */
export function RegisterBusinessForm({ categories, cities }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState("error");
      setError("החיבור למסד הנתונים לא הוגדר.");
      return;
    }

    const coverFile = form.get("cover") as File | null;
    if (!coverFile || coverFile.size === 0) {
      setState("error");
      setError("תמונת שער היא שדה חובה.");
      return;
    }

    setState("loading");
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setState("error");
      setError("החיבור פג תוקף. התחברו מחדש ונסו שוב.");
      return;
    }

    const name = String(form.get("name"));
    const categoryId = String(form.get("category"));
    const cityId = String(form.get("city")) || null;
    const slugBase = slugify(name) || "business";
    const slug = `${slugBase}-${Math.random().toString(36).slice(2, 7)}`;

    const ext = coverFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("business-images")
      .upload(path, coverFile, { contentType: coverFile.type });

    if (uploadError) {
      setState("error");
      setError("העלאת התמונה נכשלה. נסו קובץ אחר או נסו שוב.");
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("business-images").getPublicUrl(path);

    const { data: business, error: insertError } = await supabase
      .from("businesses")
      .insert({
        owner_id: user.id,
        slug,
        name,
        tagline: String(form.get("tagline")) || null,
        description: String(form.get("description")) || null,
        status: "pending",
        city_id: cityId,
        address: String(form.get("address")) || null,
        phone: String(form.get("phone")) || null,
        whatsapp: String(form.get("whatsapp")) || null,
        email: String(form.get("email")) || null,
        cover_url: publicUrl,
      })
      .select("id")
      .single();

    if (insertError || !business) {
      setState("error");
      setError("משהו השתבש בשמירת העסק. נסו שוב או פנו אלינו בוואטסאפ.");
      return;
    }

    if (categoryId) {
      await supabase
        .from("business_categories")
        .insert({ business_id: business.id, category_id: categoryId, is_primary: true });
    }

    setState("done");
    router.refresh();
  }

  if (state === "done") {
    return (
      <section className="rounded-lg border border-success-500/30 bg-success-50 p-7 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-11 w-11 text-success-500" />
        <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">הטופס נשלח</h2>
        <p className="mx-auto max-w-sm text-sm leading-relaxed text-ink-600">
          העסק ממתין לאישור מנהל, בדרך כלל תוך יום עסקים אחד. תוכלו לעקוב אחרי הסטטוס
          ולערוך פרטים בכל שלב מ<Link href="/business/dashboard" className="font-bold text-brand-700 hover:text-brand-500">אזור בעלי העסקים</Link>.
        </p>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-ink-200/70 bg-white p-6">
      <div>
        <label htmlFor="reg-cover" className="mb-1.5 block text-xs font-bold text-ink-600">
          תמונת שער <span className="text-danger-500">*</span>
        </label>
        <label
          htmlFor="reg-cover"
          className="flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed border-ink-200 bg-ink-50 text-ink-400 transition-colors hover:border-brand-300 hover:bg-brand-50"
          style={coverPreview ? { backgroundImage: `url(${coverPreview})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
        >
          {!coverPreview && (
            <>
              <ImagePlus className="h-7 w-7" />
              <span className="text-sm font-semibold">העלאת תמונה ראשית של העסק</span>
            </>
          )}
        </label>
        <input
          id="reg-cover" name="cover" type="file" accept="image/*" required
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setCoverPreview(file ? URL.createObjectURL(file) : null);
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="reg-name" name="name" label="שם העסק" required />
        <Field id="reg-tagline" name="tagline" label="שורת תיאור קצרה" placeholder="במה אתם מתמחים?" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="reg-category" className="mb-1.5 block text-xs font-bold text-ink-600">
            קטגוריה <span className="text-danger-500">*</span>
          </label>
          <select
            id="reg-category" name="category" required
            className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
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
            className="h-11 w-full rounded-sm border border-ink-200 bg-white px-3.5 text-base text-ink-900 outline-none focus:border-brand-400"
          >
            <option value="">בחרו עיר</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <Field id="reg-address" name="address" label="כתובת" placeholder="רחוב, מספר" />

      <div className="grid gap-4 sm:grid-cols-3">
        <Field id="reg-phone" name="phone" label="טלפון" type="tel" inputMode="tel" placeholder="050-0000000" />
        <Field id="reg-whatsapp" name="whatsapp" label="וואטסאפ" type="tel" inputMode="tel" placeholder="050-0000000" />
        <Field id="reg-email" name="email" label="אימייל" type="email" />
      </div>

      <div>
        <label htmlFor="reg-description" className="mb-1.5 block text-xs font-bold text-ink-600">תיאור העסק</label>
        <textarea
          id="reg-description" name="description" rows={4}
          className="w-full rounded-sm border border-ink-200 px-3.5 py-2.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
          placeholder="במה אתם עוסקים, ניסיון, מה מייחד אתכם"
        />
      </div>

      <Button
        type="submit" variant="accent" size="lg" fullWidth
        loading={state === "loading"}
        icon={<Send className="h-4.5 w-4.5" />}
      >
        שליחת הטופס לאישור
      </Button>

      {state === "error" && <p role="alert" className="text-sm text-danger-500">{error}</p>}
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
        className="h-11 w-full rounded-sm border border-ink-200 px-3.5 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-400"
        {...rest}
      />
    </div>
  );
}
