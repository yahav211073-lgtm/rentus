import type { Metadata } from "next";
import Image from "next/image";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { getContactDetails } from "@/lib/repo/settings";
import { getBrandSettings } from "@/lib/repo/branding";
import { toWhatsAppNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "צור קשר", alternates: { canonical: "/contact" } };

export default async function ContactPage() {
  const [contact, brand] = await Promise.all([getContactDetails(), getBrandSettings()]);

  const cards = [
    contact.whatsapp && {
      key: "whatsapp",
      href: `https://wa.me/${toWhatsAppNumber(contact.whatsapp)}`,
      Icon: MessageCircle,
      iconClass: "bg-[#25D366]/10 text-[#25D366]",
      title: "וואטסאפ",
      subtitle: "הדרך המהירה ביותר לחזור אליכם",
      external: true,
    },
    contact.phone && {
      key: "phone",
      href: `tel:${contact.phone}`,
      Icon: Phone,
      iconClass: "bg-brand-800/10 text-brand-700",
      title: contact.phone,
      subtitle: "חייגו ישירות",
    },
    contact.email && {
      key: "email",
      href: `mailto:${contact.email}`,
      Icon: Mail,
      iconClass: "bg-brand-800/10 text-brand-700",
      title: contact.email,
      subtitle: "לפניות במייל",
    },
  ].filter(Boolean) as {
    key: string; href: string; Icon: typeof Mail; iconClass: string; title: string; subtitle: string; external?: boolean;
  }[];

  return (
    <div className="bg-ink-50 pb-20">
      {/* --- הירו --- */}
      <div className="relative isolate h-[240px] overflow-hidden sm:h-[300px]">
        <Image src={brand.heroImageUrl} alt="" fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/92 via-brand-950/55 to-brand-950/35" />
        <div className="relative mx-auto flex h-full max-w-2xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <h1 className="mb-2 font-display text-3xl text-white sm:text-4xl">צור קשר</h1>
          <p className="text-white/80">שאלה, בעיה, או רוצים לפרסם את החברה? נשמח לשמוע.</p>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="space-y-3">
          {cards.map(({ key, href, Icon, iconClass, title, subtitle, external }) => (
            <a
              key={key}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className="group flex items-center gap-4 rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(11,59,117,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_16px_36px_-16px_rgba(11,59,117,0.2)]"
            >
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${iconClass}`}>
                <Icon className="h-5.5 w-5.5" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold text-ink-900">{title}</span>
                <span className="block text-sm text-ink-500">{subtitle}</span>
              </span>
            </a>
          ))}

          {contact.address && (
            <div className="flex items-center gap-4 rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(11,59,117,0.06)]">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800/10 text-brand-700">
                <MapPin className="h-5.5 w-5.5" />
              </span>
              <span>
                <span className="block font-bold text-ink-900">{contact.address}</span>
                <span className="block text-sm text-ink-500">כתובת</span>
              </span>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          פרטי הקשר מנוהלים מפאנל הניהול של {brand.name} ומתעדכנים כאן אוטומטית.
        </p>
      </div>
    </div>
  );
}
