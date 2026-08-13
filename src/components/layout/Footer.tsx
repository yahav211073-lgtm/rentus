import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Store } from "lucide-react";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getContactDetails } from "@/lib/repo/settings";
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
  { label: "תנאי שימוש", href: "/terms" },
  { label: "מדיניות פרטיות", href: "/privacy" },
  { label: "הצהרת נגישות", href: "/accessibility" },
  { label: "מדיניות ביקורות", href: "/review-policy" },
];

const BUSINESS_LINKS = [
  { label: "רישום עסק חינם", href: "/business/register" },
  { label: "מסלולי פרסום", href: "/pricing" },
  { label: "כניסה לניהול העסק", href: "/business/login" },
  { label: "פרסום באתר", href: "/advertise" },
];

/**
 * סמלי הרשתות מצוירים כאן ולא מיובאים.
 * lucide הסירה את אייקוני המותגים בגרסאות האחרונות (סוגיית סימני מסחר),
 * ומשיכת חבילת אייקוני-מותגים שלמה בשביל שלושה סמלים היא בזבוז.
 */
const SOCIAL = [
  {
    label: "פייסבוק", href: "#",
    path: "M14 8.5h2.5V5.6C16.06 5.53 15.02 5.4 13.8 5.4c-2.54 0-4.28 1.6-4.28 4.53V12.4H6.7v3.3h2.82V24h3.46v-8.3h2.7l.43-3.3h-3.13v-2.15c0-.95.26-1.6 1.62-1.6z",
  },
  {
    label: "אינסטגרם", href: "#",
    path: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.89 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zm0 5.68a4.16 4.16 0 100 8.32 4.16 4.16 0 000-8.32zm0 6.86a2.7 2.7 0 110-5.4 2.7 2.7 0 010 5.4zm4.33-6.98a.97.97 0 100-1.94.97.97 0 000 1.94z",
  },
  {
    label: "לינקדאין", href: "#",
    path: "M6.94 5.5a1.94 1.94 0 11-3.88 0 1.94 1.94 0 013.88 0zM3.3 8.9h3.4V21H3.3V8.9zm5.53 0h3.26v1.65h.05c.45-.86 1.56-1.77 3.22-1.77 3.44 0 4.08 2.27 4.08 5.22V21h-3.4v-5.32c0-1.27-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.81V21h-3.4V8.9z",
  },
];

export async function Footer({ brandName }: { brandName: string }) {
  const [categories, cities, contact] = await Promise.all([
    getCategoriesWithCounts(), getCities(), getContactDetails(),
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
              <span className="relative grid h-10 w-10 place-items-center rounded-sm bg-gradient-to-br from-brand-500 to-brand-700">
                <Store className="h-5 w-5 text-white" strokeWidth={2.4} />
                <span className="absolute -bottom-0.5 -left-0.5 h-2.5 w-2.5 rounded-full bg-accent-400 ring-2 ring-brand-950" />
              </span>
              <span className="font-display text-xl font-extrabold text-white">{brandName}</span>
            </Link>

            <p className="mb-6 max-w-sm text-sm leading-relaxed text-white/60">
              {brandName} — מדריך ההשכרות המוביל בישראל. אנחנו מחברים בין אנשים שצריכים
              לשכור לבין עסקים מאומתים — עם ביקורות אמיתיות, מידע מלא והשוואה הוגנת.
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
                  <MessageCircle className="h-4.5 w-4.5" strokeWidth={2.2} />
                </a>
              )}
              {SOCIAL.map(({ label, href, path }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-xs border border-white/12 bg-white/5 text-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-400/50 hover:bg-white/10 hover:text-accent-400"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5" aria-hidden="true">
                    <path d={path} />
                  </svg>
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
              <FooterLink key={c.id} href={`/search?city=${c.slug}`}>עסקים ב{c.name}</FooterLink>
            ))}
          </FooterColumn>

          <FooterColumn title="לבעלי עסקים">
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
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{title}</h2>
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
