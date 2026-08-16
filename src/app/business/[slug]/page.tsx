import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, Clock, Globe, Mail, MapPin, MessageCircle, Phone, Share2,
} from "lucide-react";
import { getApprovedReviews, getBusinessBySlug, getRelatedBusinesses } from "@/lib/repo/businesses";
import type { Business } from "@/types/domain";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ButtonLink } from "@/components/ui/Button";
import { LeadForm } from "@/components/business/LeadForm";
import { ReviewList } from "@/components/business/ReviewList";
import { WriteReviewForm } from "@/components/business/WriteReviewForm";
import { OpeningHours } from "@/components/business/OpeningHours";
import { BusinessCard } from "@/components/business/BusinessCard";
import { SocialLinks } from "@/components/business/SocialLinks";
import { Reveal } from "@/components/motion/Reveal";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { decodeParam, formatNumber, toWhatsAppNumber } from "@/lib/utils";
import { BusinessMap } from "@/components/business/BusinessMapLazy";

/**
 * עמוד פרופיל עסק.
 *
 * זה העמוד שמייצר את רוב תנועת האורגני של אינדקס עסקים, ולכן הוא
 * מקבל את מלוא הטיפול: LocalBusiness ו-BreadcrumbList ב-JSON-LD,
 * מטא-דאטה דינמית עם דירוג, וקישור canonical.
 *
 * מבנה: כיסוי → סרגל זהות דביק → תוכן בשתי עמודות, כשעמודת הפנייה
 * דביקה בדסקטופ. ההיגיון פשוט — טופס יצירת הקשר לא אמור להיעלם
 * בזמן שקוראים ביקורות.
 */

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const b = await getBusinessBySlug(slug);
  if (!b) return { title: "העסק לא נמצא" };

  const location = b.city ? ` ב${b.city.name}` : "";
  const title = b.seoTitle ?? `${b.name}${location}`;
  const description =
    b.seoDescription ??
    `${b.tagline ?? b.name}. דירוג ${b.ratingAvg} מתוך 5 על סמך ${b.reviewCount} ביקורות. פרטי קשר, שעות פעילות וגלריה.`;

  return {
    title,
    description,
    alternates: { canonical: `/business/${b.slug}` },
    robots: { index: !b.seoNoindex && b.status === "published", follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${env.siteUrl}/business/${b.slug}`,
    },
  };
}

export default async function BusinessPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const b = await getBusinessBySlug(slug);
  if (!b) notFound();

  const [reviews, related, user] = await Promise.all([
    getApprovedReviews(b.id),
    getRelatedBusinesses(b, 4),
    getCurrentUser(),
  ]);

  return (
    <>
      <JsonLd business={b} />

      {/* --- כיסוי --- */}
      <div className="relative h-[280px] overflow-hidden sm:h-[360px]">
        {b.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={b.coverUrl} alt={`תמונת רקע של ${b.name}`} className="h-full w-full object-cover" />
        ) : (
          <CoverArt seed={b.slug} className="h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-brand-950/20 to-brand-950/40" />
      </div>

      {/* --- זהות --- */}
      <div className="relative z-10 mx-auto -mt-24 max-w-[1480px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(11,59,117,0.3)] sm:p-7">
            <nav aria-label="פירורי לחם" className="mb-4">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
                <li><Link href="/" className="hover:text-brand-600">בית</Link></li>
                <li aria-hidden="true">›</li>
                {b.primaryCategory && (
                  <>
                    <li>
                      <Link href={`/category/${b.primaryCategory.slug}`} className="hover:text-brand-600">
                        {b.primaryCategory.name}
                      </Link>
                    </li>
                    <li aria-hidden="true">›</li>
                  </>
                )}
                <li className="font-medium text-ink-600" aria-current="page">{b.name}</li>
              </ol>
            </nav>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-ink-200 sm:h-24 sm:w-24">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.logoUrl} alt={`הלוגו של ${b.name}`} className="h-full w-full object-cover" />
                ) : (
                  <CoverArt seed={`${b.slug}-logo`} label={b.name.charAt(0)} compact className="h-full w-full" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl font-extrabold text-ink-900 sm:text-3xl">
                    {b.name}
                  </h1>
                  {b.isVerified && (
                    <Badge variant="verified" icon={<BadgeCheck className="h-3.5 w-3.5" />}>מאומת</Badge>
                  )}
                  {b.isSponsored && <Badge variant="sponsored">ממומן</Badge>}
                </div>

                {b.tagline && <p className="mb-3 text-md text-ink-500">{b.tagline}</p>}

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-500">
                  <Rating value={b.ratingAvg} count={b.reviewCount} size="md" />
                  {b.city && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-ink-400" />
                      {b.address ?? b.city.name}
                    </span>
                  )}
                  {b.viewCount && (
                    <span className="text-ink-400">{formatNumber(b.viewCount)} צפיות</span>
                  )}
                </div>

                {b.tags && b.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {b.tags.map((t) => <Badge key={t.id} variant="brand">{t.name}</Badge>)}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col">
                {b.phone && (
                  <ButtonLink href={`tel:${b.phone}`} variant="primary" size="lg" icon={<Phone className="h-4.5 w-4.5" />}>
                    {b.phone}
                  </ButtonLink>
                )}
                {b.whatsapp && (
                  <ButtonLink
                    href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`}
                    variant="secondary" size="lg"
                    icon={<MessageCircle className="h-4.5 w-4.5 text-[#25D366]" />}
                  >
                    וואטסאפ
                  </ButtonLink>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {/* --- תוכן --- */}
      <div className="mx-auto max-w-[1480px] px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-7 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-7">
            {b.description && (
              <Panel title="על העסק">
                <p className="whitespace-pre-line text-base leading-relaxed text-ink-600">
                  {b.description}
                </p>
              </Panel>
            )}

            {b.services && b.services.length > 0 && (
              <Panel title="שירותים ומחירון">
                <ul className="divide-y divide-ink-100">
                  {b.services.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-bold text-ink-800">{s.name}</p>
                        {s.description && (
                          <p className="mt-0.5 text-sm text-ink-500">{s.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-end">
                        {s.price != null ? (
                          <>
                            <span className="block font-display text-lg font-bold text-brand-800">
                              ₪{formatNumber(s.price)}
                            </span>
                            {s.priceUnit && (
                              <span className="text-2xs text-ink-400">{s.priceUnit}</span>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-ink-400">{s.priceUnit ?? "לפי הצעה"}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}

            <ReviewList reviews={reviews} businessName={b.name} ratingAvg={b.ratingAvg} reviewCount={b.reviewCount} />
            <WriteReviewForm
              businessId={b.id}
              businessName={b.name}
              currentUserName={user?.fullName ?? user?.email ?? null}
              returnTo={`/business/${b.slug}#write-review`}
            />
          </div>

          {/* עמודה דביקה */}
          <aside className="space-y-5 lg:sticky lg:top-[calc(var(--spacing-header)+16px)] lg:self-start">
            <LeadForm businessId={b.id} businessName={b.name} />

            {b.hours && b.hours.length > 0 && (
              <Panel title="שעות פעילות" icon={<Clock className="h-4 w-4" />}>
                <OpeningHours hours={b.hours} />
              </Panel>
            )}

            <Panel title="פרטי קשר">
              <ul className="space-y-3 text-sm">
                {b.address && (
                  <ContactRow icon={<MapPin className="h-4 w-4" />}>{b.address}</ContactRow>
                )}
                {b.phone && (
                  <ContactRow icon={<Phone className="h-4 w-4" />}>
                    <a href={`tel:${b.phone}`} className="hover:text-brand-600" dir="ltr">{b.phone}</a>
                  </ContactRow>
                )}
                {b.email && (
                  <ContactRow icon={<Mail className="h-4 w-4" />}>
                    <a href={`mailto:${b.email}`} className="hover:text-brand-600" dir="ltr">{b.email}</a>
                  </ContactRow>
                )}
                {b.website && (
                  <ContactRow icon={<Globe className="h-4 w-4" />}>
                    <a
                      href={b.website} target="_blank" rel="noopener noreferrer nofollow"
                      className="hover:text-brand-600"
                    >
                      אתר העסק
                    </a>
                  </ContactRow>
                )}
              </ul>

              {/* רק רשתות שהוגדרו בפועל. הרכיב מחזיר null כשאין אף אחת. */}
              <SocialLinks business={b} className="mt-4" />

              {b.latitude != null && b.longitude != null && (
                <div className="mt-4">
                  <BusinessMap latitude={b.latitude} longitude={b.longitude} name={b.name} address={b.address} />
                </div>
              )}

              <ShareRow name={b.name} />
            </Panel>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-6 font-display text-2xl font-extrabold text-ink-900">
              עסקים דומים באזור
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => <BusinessCard key={r.id} business={r} />)}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

/* ============================================================================
   רכיבי עזר
   ============================================================================ */

function Panel({
  title, children, icon,
}: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-ink-200/70 bg-white p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-ink-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5 text-ink-600">
      <span className="mt-0.5 shrink-0 text-ink-400">{icon}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </li>
  );
}

function ShareRow({ name }: { name: string }) {
  return (
    <div className="mt-4 border-t border-ink-100 pt-4">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(name)}`}
        target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-600"
      >
        <Share2 className="h-4 w-4" />
        שיתוף העסק
      </a>
    </div>
  );
}

/**
 * נתונים מובנים.
 *
 * aggregateRating נכלל רק כשיש ביקורות בפועל. סימון דירוג בלי
 * ביקורות הוא הפרה של הנחיות גוגל וגורר עונש על כל הדומיין —
 * לא רק על העמוד הזה.
 */
function JsonLd({ business: b }: { business: Business }) {
  const url = `${env.siteUrl}/business/${b.slug}`;

  const localBusiness: Record<string, unknown> = {
    "@type": "LocalBusiness",
    "@id": url,
    name: b.name,
    description: b.description ?? b.tagline ?? undefined,
    url,
    telephone: b.phone ?? undefined,
    email: b.email ?? undefined,
    priceRange: b.priceRange ? "₪".repeat(b.priceRange) : undefined,
    address: b.address
      ? {
          "@type": "PostalAddress",
          streetAddress: b.address,
          addressLocality: b.city?.name,
          addressCountry: "IL",
        }
      : undefined,
    geo: b.latitude && b.longitude
      ? { "@type": "GeoCoordinates", latitude: b.latitude, longitude: b.longitude }
      : undefined,
    openingHoursSpecification: b.hours
      ?.filter((h) => !h.isClosed && h.opensAt && h.closesAt)
      .map((h) => ({
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][h.dayOfWeek],
        opens: h.opensAt,
        closes: h.closesAt,
      })),
  };

  if (b.reviewCount > 0) {
    localBusiness.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: b.ratingAvg,
      reviewCount: b.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      localBusiness,
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "בית", item: env.siteUrl },
          ...(b.primaryCategory
            ? [{
                "@type": "ListItem", position: 2,
                name: b.primaryCategory.name,
                item: `${env.siteUrl}/category/${b.primaryCategory.slug}`,
              }]
            : []),
          { "@type": "ListItem", position: b.primaryCategory ? 3 : 2, name: b.name, item: url },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
