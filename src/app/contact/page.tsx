import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getContactDetails } from "@/lib/repo/settings";
import { getBrandSettings } from "@/lib/repo/branding";
import { toWhatsAppNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "צור קשר", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const [contact, brand] = await Promise.all([getContactDetails(), getBrandSettings()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="mb-3 font-display text-3xl font-extrabold text-ink-900">צור קשר</h1>
      <p className="mb-10 text-ink-500">שאלה, בעיה, או רוצים לפרסם את העסק? נשמח לשמוע.</p>

      <div className="space-y-3">
        {contact.whatsapp && (
          <a
            href={`https://wa.me/${toWhatsAppNumber(contact.whatsapp)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 border border-ink-200/70 bg-white p-4 transition-colors hover:border-success-500/50"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            <span className="font-semibold text-ink-800">וואטסאפ — הדרך המהירה ביותר</span>
          </a>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="flex items-center gap-3 border border-ink-200/70 bg-white p-4 transition-colors hover:border-brand-300">
            <Phone className="h-5 w-5 text-brand-700" />
            <span className="font-semibold text-ink-800">{contact.phone}</span>
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="flex items-center gap-3 border border-ink-200/70 bg-white p-4 transition-colors hover:border-brand-300">
            <Mail className="h-5 w-5 text-brand-700" />
            <span className="font-semibold text-ink-800">{contact.email}</span>
          </a>
        )}
        {contact.address && (
          <div className="flex items-center gap-3 border border-ink-200/70 bg-white p-4">
            <MapPin className="h-5 w-5 text-brand-700" />
            <span className="font-semibold text-ink-800">{contact.address}</span>
          </div>
        )}
      </div>

      <p className="mt-8 text-xs text-ink-400">
        פרטי הקשר מנוהלים מפאנל הניהול של {brand.name} ומתעדכנים כאן אוטומטית.
      </p>
    </div>
  );
}
