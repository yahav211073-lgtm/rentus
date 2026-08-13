import type { Metadata } from "next";
import { Megaphone } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { getBrandSettings } from "@/lib/repo/branding";

export const metadata: Metadata = { title: "פרסום באתר", alternates: { canonical: "/advertise" } };

export default async function AdvertisePage() {
  const brand = await getBrandSettings();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <Megaphone className="mx-auto mb-5 h-10 w-10 text-brand-700" />
      <h1 className="mb-3 font-display text-3xl font-extrabold text-ink-900">פרסום ב-{brand.name}</h1>
      <p className="mb-8 text-lg leading-relaxed text-ink-600">
        באנרים ומודעות מוצגות לגולשים שכבר מחפשים בדיוק את מה שאתם מציעים —
        לצד תוצאות החיפוש ובעמוד הבית. השטח הפרסומי מנוהל ידנית, כדי לשמור על איכות הפרסום שמוצג.
      </p>
      <ButtonLink href="/contact" variant="accent" size="lg">דברו איתנו על פרסום</ButtonLink>
    </div>
  );
}
