import Link from "next/link";
import { Mail, MapPin, Phone, Store } from "lucide-react";
import {
  FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon,
} from "@/components/ui/icons";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getContactDetails, getSocialLinks } from "@/lib/repo/settings";
import { getCities } from "@/lib/repo/taxonomy";
import { toWhatsAppNumber } from "@/lib/utils";

/**
 * פוטר.
 *
 * ארבע עמודות בדסקטופ, אקורדיון-כמו במובייל (פשוט נערמות).
 * הרקע כהה בכוונה: הוא סוגר את העמוד ויוצר "קרקע" אחרי רצף
 * הסקציות הבהירות. אתר שנגמר בלבן מרגיש כאילו נקטע.
 */

const LEGAL_LINKS = [
  { label: "שאלות ותשובות", href: "/faq" },
  { label: "תנאי שימוש", href: "/terms" },
  { label: "מדיניות פרטיות", href: "/privacy" },
  { label: "הצהרת נגישות", href: "/accessibility" },
  { label: "מדיניות ביקורות", href: "/review-policy" },
  { label: "כתבו ביקורת על האתר", href: "/review" },
];

const BUSINESS_LINKS = [
  { label: "רישום חברה חינם", href: "/business/register" },
  { label: "מסלולי פרסום", href: "/pricing" },
  { label: "כניסה לניהול החברה", href: "/business/login" },
  { label: "פרסום באתר", href: "/advertise" },
];

const SOCIAL = [
  { key: "facebook", label: "פייסבוק", Icon: FacebookIcon },
  { key: "instagram", label: "אינסטגרם", Icon: InstagramIcon },
  { key: "tiktok", label: "טיקטוק", Icon: TikTokIcon },
  { key: "youtube", label: "יוטיוב", Icon: YouTubeIcon },
] as const;

function isWebUrl(value?: string) {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

export async function Footer({ brandName, logoUrl }: { brandName: string; logoUrl?: string | null }) {
  const [categories, cities, contact, social] = await Promise.all([
    getCategoriesWithCounts(), getCities(), getContactDetails(), getSocialLinks(),
  ]);
  const topCategories = categories.slice(0, 8);
  const popularCities = cities.slice(0, 8);

  return (
    <footer className="relative mt-24 overflow-hidden bg-brand-950 text-white/75">
      {/* זוהר עדין בקצה העליון — מרכך את המעבר מהתוכן הבהיר */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(37,99,190,0.55), transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* מותג */}
          <div>
            <Link href="/" className="mb-5 inline-flex items-center gap-2.5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={brandName} className="h-10 w-auto max-w-[190px] object-contain brightness-0 invert" />
              ) : (
                <>
                  <span className="relative grid h-10 w-10 place-items-center rounded-sm bg-gradient-to-br from-brand-500 to-brand-700">
                    <Store className="h-5 w-5 text-white" strokeWidth={2.4} />
                    <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-accent-400 ring-2 ring-brand-950" />
                  </span>
                  <span className="font-display text-xl font-extrabold text-white">{brandName}</span>
                </>
              )}
            </Link>

            <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/60">
              {brandName} — מדריך ההשכרות המוביל בישראל. אנחנו מחברים בין אנשים שצריכים
              לשכור לבין חברות מאומתות — עם ביקורות אמיתיות, מידע מלא והשוואה הוגנת.
            </p>

            <ul className="space-y-2.5 text-sm">
              {contact.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-accent-400" />
                  <a href={`tel:${contact.phone}`} className="hover:text-white">{contact.phone}</a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-accent-400" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white">{contact.email}</a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-center gap-2.5">
                  <MapPin className="h-4 w-4 shrink-0 text-accent-400" />
                  <span>{contact.address}</span>
                </li>
              )}
            </ul>

            <div className="mt-6 flex gap-2">
              {contact.whatsapp && (
                <a
                  href={`https://wa.me/${toWhatsAppNumber(contact.whatsapp)}`}
                  target="_blank" rel="noopener noreferrer"
                  aria-label="וואטסאפ"
                  className="grid h-10 w-10 place-items-center rounded-xs border border-white/12 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#25D366]/50 hover:bg-white/10 hover:text-[#25D366]"
                >
                  <WhatsAppIcon className="h-4.5 w-4.5" />
                </a>
              )}
              {/* רק רשתות שהוגדרו ב-/admin/settings. קודם היו כאן שלושה
                  קישורים קבועים עם href="#" — אייקונים שנראים כמו הבטחה
                  ולא מובילים לשום מקום. */}
              {SOCIAL.filter((s) => isWebUrl(social[s.key])).map(({ key, label, Icon }) => (
                <a
                  key={key}
                  href={social[key]}
                  target="_blank" rel="noopener noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-xs border border-white/12 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400/50 hover:bg-white/10 hover:text-accent-400"
                >
                  <Icon className="h-4.5 w-4.5" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="קטגוריות מובילות">
            {topCategories.map((c) => (
              <FooterLink key={c.id} href={`/category/${c.slug}`}>{c.name}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="ערים מובילות">
            {popularCities.map((c) => (
              <FooterLink key={c.id} href={`/search?city=${c.slug}`}>חברות ב{c.name}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="לבעלי חברות">
            {BUSINESS_LINKS.map((l) => (
              <FooterLink key={l.href} href={l.href}>{l.label}</FooterLink>
            ))}
          </FooterColumn>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {brandName}. כל הזכויות שמורות.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {LEGAL_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white/55 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-4 text-sm uppercase tracking-wide text-white">{title}</h2>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block text-sm text-white/60 transition-all duration-200 hover:translate-x-[-3px] hover:text-white"
      >
        {children}
      </Link>
    </li>
  );
}
