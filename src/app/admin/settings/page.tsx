import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getAboutContent } from "@/lib/repo/settings";

export const metadata = { title: "הגדרות אתר", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const [{ data: rows }, aboutContent] = await Promise.all([
    supabase
      .from("settings")
      .select("key, value")
      .in("key", ["brand.identity", "brand.colors", "contact.details", "social.links"]),
    getAboutContent(),
  ]);

  const byKey = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value as Record<string, string>]));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl text-ink-900">הגדרות אתר</h1>
      <p className="mb-6 text-sm text-ink-500">
        כל שינוי כאן נכנס לתוקף באתר הציבורי מיד עם השמירה — אין ערכים קשיחים בקוד שדורסים אותו.
      </p>

      <SettingsForm
        brandIdentity={{
          name: byKey["brand.identity"]?.name ?? "",
          tagline: byKey["brand.identity"]?.tagline ?? "",
          logoUrl: byKey["brand.identity"]?.logoUrl ?? null,
          heroImageUrl: byKey["brand.identity"]?.heroImageUrl ?? "/images/hero-stage.jpg",
        }}
        brandColors={{
          primary: byKey["brand.colors"]?.primary ?? "#0C1D40",
          secondary: byKey["brand.colors"]?.secondary ?? "#1D3B78",
          accent: byKey["brand.colors"]?.accent ?? "#F6741E",
          background: byKey["brand.colors"]?.background ?? "#F7F9FC",
        }}
        contactDetails={{
          phone: byKey["contact.details"]?.phone ?? "",
          email: byKey["contact.details"]?.email ?? "",
          address: byKey["contact.details"]?.address ?? "",
          whatsapp: byKey["contact.details"]?.whatsapp ?? "",
        }}
        socialLinks={byKey["social.links"] ?? {}}
        aboutContent={aboutContent}
      />
    </div>
  );
}
