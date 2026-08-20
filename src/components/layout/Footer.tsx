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
    <footer className="relative mt-12 overflow-hidden bg-brand-950 text-white/75 sm:mt-20 lg:mt-24">
      {/* זוהר עדין בקצה העליון — מרכך את המעבר מהתוכן הבהיר */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-40"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(37,99,190,0.55), transparent 70%)" }}
        aria-hidden="true"
      />
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-[0.35]" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1480px] px-4 pb-8 pt-10 sm:px-6 sm:pb-10 sm:pt-16 lg:px-8">
        {/* שלוש עמודות הקישורים יורדות לשתי עמודות במובייל ולא לאחת.
            בעמודה אחת שלושת הבלוקים הם 24 שורות קישור בטור — כמעט
            1,200px של פוטר, יותר מגובה מסך שלם, בשביל תוכן משני.
            גוש המותג נשאר על שתי העמודות כי הלוגו והטקסט שלצידו
            צריכים את הרוחב המלא. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-10">
          {/* מותג */}
          <div className="col-span-2 lg:col-span-1">
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

            <p className="mb-4 max-w-sm text-sm leading-relaxed text-white/60 sm:mb-6">
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

            <div className="mt-4 flex gap-2 sm:mt-6">
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

        <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-5 sm:mt-12 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:pt-6">
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {brandName}. כל הזכויות שמורות.
          </p>
          {/* ריפוד בצד ההתחלה במובייל: כפתור הנגישות הצף יושב שם
              בפינה, ובלי הריפוד הוא חופף את הקישור הראשון בשורה. */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2 ps-16 text-xs sm:ps-0">
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
      <h2 className="mb-2.5 text-sm uppercase tracking-wide text-white sm:mb-4">{title}</h2>
      <ul className="space-y-1.5 sm:space-y-2.5">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="inline-block text-xs text-white/60 transition-all duration-200 hover:translate-x-[-3px] hover:text-white sm:text-sm"
      >
        {children}
      </Link>
    </li>
  );
}
