import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck, CalendarCheck, Clock, Globe, Images, Mail, MapPin, MessageCircle,
  Navigation, Phone, Route, ShieldCheck, Sparkles, Store, Tag as TagIcon, Wallet,
} from "lucide-react";

import { getApprovedReviews, getBusinessBySlug, getRelatedBusinesses } from "@/lib/repo/businesses";
import type { Business } from "@/types/domain";
import { CoverArt } from "@/components/ui/CoverArt";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { ButtonLink } from "@/components/ui/Button";
import { ReviewList } from "@/components/business/ReviewList";
import { WriteReviewForm } from "@/components/business/WriteReviewForm";
import { OpeningHours } from "@/components/business/OpeningHours";
import { CompanyListCard } from "@/components/business/CompanyListCard";
import { SocialLinks } from "@/components/business/SocialLinks";
import { BusinessGallery } from "@/components/business/BusinessGallery";
import { ReadMore } from "@/components/business/ReadMore";
import { ShareButton } from "@/components/business/ShareButton";
import { Reveal } from "@/components/motion/Reveal";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { decodeParam, formatNumber, toWhatsAppNumber, wazeLink, jsonLd } from "@/lib/utils";
import { BusinessMap } from "@/components/business/BusinessMapLazy";

/**
 * עמוד פרופיל עסק.
 *
 * זה העמוד שמייצר את רוב תנועת האורגני של אינדקס עסקים, ולכן הוא
 * מקבל את מלוא הטיפול: LocalBusiness ו-BreadcrumbList ב-JSON-LD,
 * מטא-דאטה דינמית עם דירוג, וקישור canonical.
 *
 * מבנה: פירורי לחם → כרטיס זהות (תמונה + פעולות) → רצועת נתונים כהה →
 * שלוש עמודות (קשר · אודות · אזור שירות) → שעות וגלריה → ביקורות →
 * חברות דומות → CTA לבעלי עסקים. במובייל: סרגל פעולה דביק בתחתית.
 *
 * העיקרון שחוזר בכל הקובץ: פאנל בלי נתון אמיתי לא מרונדר. עמוד עסק
 * חדש שאין לו עדיין גלריה, ביקורות או שעות פעילות אמור להיראות
 * קצר ומכובד, לא כמו עמוד מלא בשלדים ריקים. לכן גם רצועת הנתונים
 * דורשת שלושה ערכים אמיתיים לפחות לפני שהיא בכלל מופיעה.
 */

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const b = await getBusinessBySlug(slug);
  if (!b) return { title: "החברה לא נמצאה" };

  const location = b.city ? ` ב${b.city.name}` : "";
  const title = b.seoTitle ?? `${b.name}${location}`;
  const ratingPart =
    b.reviewCount > 0
      ? `דירוג ${b.ratingAvg.toFixed(1)} מתוך 5 על סמך ${b.reviewCount} ביקורות. `
      : "";
  const description =
    b.seoDescription ?? `${b.tagline ?? b.name}. ${ratingPart}פרטי קשר, שעות פעילות וגלריה.`;

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
      images: b.coverUrl ? [{ url: b.coverUrl }] : undefined,
    },
  };
}

export default async function BusinessPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const b = await getBusinessBySlug(slug);
  if (!b) notFound();

  const [reviews, related, user, brand] = await Promise.all([
    getApprovedReviews(b.id),
    getRelatedBusinesses(b, 4),
    getCurrentUser(),
    getBrandSettings(),
  ]);

  const gallery = b.gallery ?? [];
  const services = b.services ?? [];
  const hours = b.hours ?? [];
  const stats = buildStats(b);
  const highlights = buildHighlights(b);
  const waze = wazeLink(b);
  const hasLocation = Boolean(
    b.address || b.city || b.area || b.isMobileService || b.serviceAreas?.length,
  );

  return (
    <div className="bg-ink-50 pb-16 sm:pb-20">
      <JsonLd business={b} />

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8">
        {/* --- פירורי לחם --- */}
        <nav aria-label="פירורי לחם" className="py-4">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-400">
            <li><Link href="/" className="transition-colors hover:text-brand-600">דף הבית</Link></li>
            <li aria-hidden="true">›</li>
            {b.primaryCategory && (
              <>
                <li>
                  <Link
                    href={`/category/${b.primaryCategory.slug}`}
                    className="transition-colors hover:text-brand-600"
                  >
                    {b.primaryCategory.name}
                  </Link>
                </li>
                <li aria-hidden="true">›</li>
              </>
            )}
            <li className="font-semibold text-ink-600" aria-current="page">{b.name}</li>
          </ol>
        </nav>

        {/* ================= כרטיס הזהות ================= */}
        <Reveal>
          <section className="overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-[0_18px_44px_-24px_rgba(12,29,64,0.28)]">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,46%)_minmax(0,54%)]">
              {/* תמונה */}
              <div className="relative aspect-16/10 lg:aspect-auto lg:min-h-[340px]">
                {b.coverUrl ? (
                  <Image
                    src={b.coverUrl}
                    alt={`${b.name} — תמונת החברה`}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 660px"
                    className="object-cover"
                  />
                ) : (
                  <CoverArt seed={b.slug} className="h-full w-full" />
                )}

                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-950/45 via-transparent to-transparent" />

                {b.isVerified && (
                  <span className="absolute top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-2xs font-bold text-brand-800 shadow-sm backdrop-blur" style={{ insetInlineStart: 16 }}>
                    <BadgeCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />
                    חברה מאומתת
                  </span>
                )}

                {gallery.length > 0 && (
                  <a
                    href="#gallery"
                    className="absolute bottom-4 inline-flex items-center gap-1.5 rounded-full bg-brand-950/75 px-3.5 py-2 text-2xs font-bold text-white backdrop-blur transition-colors hover:bg-brand-950/90"
                    style={{ insetInlineEnd: 16 }}
                  >
                    <Images className="h-4 w-4" aria-hidden="true" />
                    {gallery.length} תמונות
                  </a>
                )}
              </div>

              {/* זהות ופעולות */}
              <div className="flex flex-col gap-5 p-5 sm:p-7 lg:p-8">
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="font-display text-2xl leading-tight text-ink-900 sm:text-3xl">
                      {b.name}
                    </h1>
                    {b.tagline && (
                      <p className="mt-1.5 text-md leading-relaxed text-ink-500">{b.tagline}</p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                      {b.reviewCount > 0 ? (
                        <Rating value={b.ratingAvg} count={b.reviewCount} size="md" variant="stars" />
                      ) : (
                        <span className="text-sm text-ink-400">אין עדיין ביקורות</span>
                      )}
                      {b.primaryCategory && (
                        <Link
                          href={`/category/${b.primaryCategory.slug}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-500"
                        >
                          <TagIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {b.primaryCategory.name}
                        </Link>
                      )}
                      {b.isSponsored && <Badge variant="sponsored">ממומן</Badge>}
                    </div>
                  </div>

                  {/* לוגו. יושב על גבול הכרטיס ולא בתוך הזרימה — זה מה
                      שנותן לו נוכחות של סמל מותג ולא של עוד אייקון. */}
                  {b.logoUrl && (
                    <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-ink-200 bg-white p-1.5 shadow-sm sm:h-20 sm:w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={b.logoUrl}
                        alt={`הלוגו של ${b.name}`}
                        className="h-full w-full object-contain"
                      />
                    </span>
                  )}
                </div>

                {highlights.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {highlights.map((h) => (
                      <li
                        key={h.label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1.5 text-2xs font-bold text-ink-700"
                      >
                        <h.Icon className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
                        {h.label}
                      </li>
                    ))}
                  </ul>
                )}

                {/* פעולות */}
                {/* פעולות. אין כאן טופס פנייה: פנייה דרך האתר בוטלה
                    כהחלטת מוצר, והגולש פונה ישירות. הטלפון הוא הפעולה
                    הראשית ולכן הוא הכפתור המלא — והוא מציג את המספר
                    עצמו, כי "התקשרו" גנרי מסתיר בדיוק את מה שמשווים. */}
                <div className="mt-auto flex flex-wrap gap-2.5 border-t border-ink-100 pt-5">
                  {b.phone && (
                    <a
                      href={`tel:${b.phone}`}
                      className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xs bg-accent-500 px-6 font-bold text-white transition-colors hover:bg-accent-600 sm:flex-none"
                    >
                      <Phone className="h-4.5 w-4.5" aria-hidden="true" />
                      <span dir="ltr">{b.phone}</span>
                    </a>
                  )}

                  {b.whatsapp && (
                    <a
                      href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xs border border-[#25D366]/45 bg-[#25D366]/8 px-5 font-bold text-[#0f7a3d] transition-colors hover:bg-[#25D366]/16"
                    >
                      <MessageCircle className="h-4.5 w-4.5" aria-hidden="true" />
                      וואטסאפ
                    </a>
                  )}

                  {waze && (
                    <a
                      href={waze}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-xs border border-[#33CCFF]/50 bg-[#33CCFF]/10 px-5 font-bold text-[#0a6f91] transition-colors hover:bg-[#33CCFF]/20"
                    >
                      <Navigation className="h-4.5 w-4.5" aria-hidden="true" />
                      ניווט ב-Waze
                    </a>
                  )}

                  <ShareButton title={b.name} className="h-12" />
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* ================= רצועת נתונים ================= */}
        {stats.length >= 3 && (
          <Reveal>
            <section
              aria-label="נתוני החברה"
              className="mt-4 overflow-hidden rounded-xl bg-brand-900 sm:mt-5"
            >
              <ul className="grid divide-y divide-white/10 sm:grid-cols-2 sm:divide-y-0 lg:flex lg:divide-x lg:divide-x-reverse">
                {stats.map((stat) => (
                  <li
                    key={stat.label}
                    className="flex flex-1 items-center gap-3.5 px-5 py-5 sm:border-b sm:border-white/10 lg:border-b-0"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/10 text-white">
                      <stat.Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display text-xl font-extrabold leading-none text-white">
                        {stat.value}
                      </span>
                      <span className="mt-1 block text-xs text-white/55">{stat.label}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </Reveal>
        )}

        {/* ================= קשר · אודות · אזור שירות ================= */}
        <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-[300px_minmax(0,1fr)_300px]">
          {/* פרטי קשר */}
          <Panel title="פרטי התקשרות" className="lg:order-1">
            <ul className="space-y-3.5 text-sm">
              {b.phone && (
                <ContactRow icon={<Phone className="h-4 w-4" />} label="טלפון">
                  <a href={`tel:${b.phone}`} className="font-semibold hover:text-brand-600" dir="ltr">
                    {b.phone}
                  </a>
                </ContactRow>
              )}
              {b.phoneSecondary && (
                <ContactRow icon={<Phone className="h-4 w-4" />} label="טלפון נוסף">
                  <a href={`tel:${b.phoneSecondary}`} className="font-semibold hover:text-brand-600" dir="ltr">
                    {b.phoneSecondary}
                  </a>
                </ContactRow>
              )}
              {b.whatsapp && (
                <ContactRow icon={<MessageCircle className="h-4 w-4" />} label="וואטסאפ">
                  <a
                    href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="font-semibold hover:text-brand-600"
                  >
                    שליחת הודעה
                  </a>
                </ContactRow>
              )}
              {b.email && (
                <ContactRow icon={<Mail className="h-4 w-4" />} label="אימייל">
                  <a href={`mailto:${b.email}`} className="break-all font-semibold hover:text-brand-600" dir="ltr">
                    {b.email}
                  </a>
                </ContactRow>
              )}
              {b.website && (
                <ContactRow icon={<Globe className="h-4 w-4" />} label="אתר">
                  <a
                    href={b.website} target="_blank" rel="noopener noreferrer nofollow"
                    className="font-semibold hover:text-brand-600"
                  >
                    לאתר החברה
                  </a>
                </ContactRow>
              )}
              {b.address && (
                <ContactRow icon={<MapPin className="h-4 w-4" />} label="כתובת">
                  <span className="font-semibold text-ink-700">{b.address}</span>
                  {b.addressNote && (
                    <span className="mt-0.5 block text-xs font-normal text-ink-400">{b.addressNote}</span>
                  )}
                </ContactRow>
              )}
            </ul>

            <SocialLinks business={b} className="mt-5 border-t border-ink-100 pt-4" />
          </Panel>

          {/* אודות + מחירון */}
          <div className="space-y-4 sm:space-y-5 lg:order-2">
            {b.description ? (
              <Panel title="אודות החברה">
                <ReadMore text={b.description} clampAt={520} />
                {highlights.length > 0 && (
                  <ul className="mt-6 grid gap-4 border-t border-ink-100 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                    {highlights.map((h) => (
                      <li key={h.label} className="text-center">
                        <span className="mx-auto mb-2 grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700">
                          <h.Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span className="block text-sm font-bold text-ink-800">{h.label}</span>
                        {h.sub && <span className="mt-0.5 block text-xs text-ink-400">{h.sub}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            ) : null}

            {services.length > 0 && (
              <Panel title="שירותים ומחירון" icon={<Wallet className="h-4 w-4 text-brand-600" />}>
                <ul className="divide-y divide-ink-100">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-bold text-ink-800">
                          {s.name}
                          {s.isFeatured && (
                            <span className="rounded-full bg-gold-100 px-2 py-0.5 text-2xs font-bold text-gold-700">
                              מומלץ
                            </span>
                          )}
                        </p>
                        {s.description && (
                          <p className="mt-1 text-sm leading-relaxed text-ink-500">{s.description}</p>
                        )}
                      </div>
                      <div className="shrink-0 text-end">
                        {s.price != null ? (
                          <>
                            <span className="block font-display text-lg font-extrabold text-brand-800">
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
                {b.priceNote && (
                  <p className="mt-4 rounded-sm bg-ink-50 px-3.5 py-2.5 text-xs leading-relaxed text-ink-500">
                    {b.priceNote}
                  </p>
                )}
              </Panel>
            )}
          </div>

          {/* אזור שירות */}
          {hasLocation && (
            <Panel title="אזור שירות" icon={<Route className="h-4 w-4 text-brand-600" />} className="lg:order-3">
              {b.latitude != null && b.longitude != null && (
                <div className="mb-4 overflow-hidden rounded-md">
                  <BusinessMap
                    latitude={b.latitude}
                    longitude={b.longitude}
                    name={b.name}
                    address={b.address}
                  />
                </div>
              )}

              <ul className="flex flex-wrap gap-2">
                {/* אזורי השירות קודמים לעיר ולאזור המושב: זה מה
                    שהגולש בא לבדוק — האם מגיעים אליו. */}
                {(b.serviceAreas ?? []).map((a) => (
                  <li
                    key={a.id}
                    className="rounded-full bg-brand-700 px-3 py-1.5 text-2xs font-bold text-white"
                  >
                    {a.name}
                  </li>
                ))}
                {b.area && (
                  <li className="rounded-full bg-brand-50 px-3 py-1.5 text-2xs font-bold text-brand-700">
                    {b.area.name}
                  </li>
                )}
                {b.city && (
                  <li className="rounded-full bg-brand-50 px-3 py-1.5 text-2xs font-bold text-brand-700">
                    {b.city.name}
                  </li>
                )}
                {b.isMobileService && (
                  <li className="rounded-full bg-success-50 px-3 py-1.5 text-2xs font-bold text-success-700">
                    מגיעים עד הלקוח
                    {b.serviceRadiusKm ? ` · עד ${b.serviceRadiusKm} ק״מ` : ""}
                  </li>
                )}
              </ul>

              {b.city && (
                <Link
                  href={`/search?city=${b.city.slug}`}
                  className="mt-4 inline-flex text-sm font-bold text-brand-700 transition-colors hover:text-brand-500"
                >
                  חברות נוספות ב{b.city.name} ←
                </Link>
              )}
            </Panel>
          )}
        </div>

        {/* ================= שעות + גלריה ================= */}
        {(hours.length > 0 || gallery.length > 0) && (
          <div className="mt-4 grid gap-4 sm:mt-5 sm:gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
            {hours.length > 0 && (
              <Panel
                title="שעות פעילות"
                icon={<Clock className="h-4 w-4 text-brand-600" />}
                className={gallery.length === 0 ? "lg:col-span-2" : undefined}
              >
                <OpeningHours hours={hours} />
              </Panel>
            )}

            {gallery.length > 0 && (
              <Panel
                id="gallery"
                title="גלריית תמונות"
                icon={<Images className="h-4 w-4 text-brand-600" />}
                className={hours.length === 0 ? "lg:col-span-2" : undefined}
              >
                <BusinessGallery images={gallery} businessName={b.name} />
              </Panel>
            )}
          </div>
        )}

        {/* ================= ביקורות ================= */}
        <div className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
          <ReviewList
            reviews={reviews}
            businessName={b.name}
            ratingAvg={b.ratingAvg}
            reviewCount={b.reviewCount}
          />
          <WriteReviewForm
            businessId={b.id}
            businessName={b.name}
            currentUserName={user?.fullName ?? user?.email ?? null}
            returnTo={`/business/${b.slug}#write-review`}
          />
        </div>

        {/* ================= חברות דומות ================= */}
        {related.length > 0 && (
          <section className="mt-12 sm:mt-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 className="font-display text-2xl text-ink-900">
                חברות נוספות בתחום
              </h2>
              {b.primaryCategory && (
                <Link
                  href={`/category/${b.primaryCategory.slug}`}
                  className="text-sm font-bold text-brand-700 transition-colors hover:text-brand-500"
                >
                  לכל החברות ב{b.primaryCategory.name} ←
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((r) => <CompanyListCard key={r.id} business={r} />)}
            </div>
          </section>
        )}

        {/* ================= CTA לבעלי עסקים ================= */}
        <section className="mt-12 overflow-hidden rounded-xl bg-brand-900 px-6 py-10 text-center sm:mt-16 sm:px-12 sm:py-12">
          <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white">
            <Store className="h-6 w-6" aria-hidden="true" />
          </span>
          <h2 className="font-display text-2xl text-white sm:text-3xl">
            בעלי עסק בתחום ההשכרה?
          </h2>
          <p className="mx-auto mt-2.5 max-w-lg text-md leading-relaxed text-white/65">
            הצטרפו ל{brand.name} וקבלו פניות מלקוחות שכבר מחפשים בדיוק את מה שאתם משכירים.
          </p>
          <ButtonLink href="/business/register" variant="accent" size="lg" className="mt-6">
            הצטרפות לחברות
          </ButtonLink>
        </section>
      </div>

      {/* ================= סרגל פעולה דביק במובייל ================= */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <div className="flex gap-2">
          {/* במובייל הטלפון תופס את כל הרוחב הפנוי — זו הפעולה
              היחידה שכמעט תמיד רוצים מהסרגל הדביק. */}
          {b.phone && (
            <a
              href={`tel:${b.phone}`}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xs bg-accent-500 px-4 font-bold text-white"
            >
              <Phone className="h-5 w-5" aria-hidden="true" />
              <span dir="ltr">{b.phone}</span>
            </a>
          )}
          {b.whatsapp && (
            <a
              href={`https://wa.me/${toWhatsAppNumber(b.whatsapp)}`}
              target="_blank" rel="noopener noreferrer"
              aria-label="שליחת הודעת וואטסאפ"
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xs border border-[#25D366]/45 bg-[#25D366]/10 text-[#0f7a3d]"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
          {waze && (
            <a
              href={waze}
              target="_blank" rel="noopener noreferrer"
              aria-label={`ניווט ב-Waze אל ${b.name}`}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-xs border border-[#33CCFF]/50 bg-[#33CCFF]/10 text-[#0a6f91]"
            >
              <Navigation className="h-5 w-5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   נתונים נגזרים
   ----------------------------------------------------------------------------
   שתי הפונקציות האלה הן הלב של "לא להמציא נתונים": כל ערך כאן נגזר
   משדה שקיים במסד לעסק הזה. שדה ריק → הפריט פשוט לא נכנס לרשימה,
   וכשהרשימה קצרה מדי הסקציה כולה לא מרונדרת.
   ============================================================================ */

type Icon = React.ComponentType<{ className?: string }>;

function buildStats(b: Business): { Icon: Icon; value: string; label: string }[] {
  const stats: { Icon: Icon; value: string; label: string }[] = [];
  const services = b.services ?? [];
  const gallery = b.gallery ?? [];

  if (b.reviewCount > 0) {
    stats.push({ Icon: Sparkles, value: b.ratingAvg.toFixed(1), label: "דירוג ממוצע" });
    stats.push({
      Icon: BadgeCheck,
      value: formatNumber(b.reviewCount),
      label: b.reviewCount === 1 ? "ביקורת מאומתת" : "ביקורות מאומתות",
    });
  }
  if (b.foundedYear) {
    const years = new Date().getFullYear() - b.foundedYear;
    if (years > 0) stats.push({ Icon: ShieldCheck, value: `${years}+`, label: "שנות פעילות" });
  }
  if (services.length > 0) {
    stats.push({
      Icon: Wallet,
      value: formatNumber(services.length),
      label: services.length === 1 ? "שירות במחירון" : "שירותים במחירון",
    });
  }
  if (gallery.length > 0) {
    stats.push({
      Icon: Images,
      value: formatNumber(gallery.length),
      label: gallery.length === 1 ? "תמונה בגלריה" : "תמונות בגלריה",
    });
  }
  if (b.categories.length > 0) {
    stats.push({
      Icon: TagIcon,
      value: formatNumber(b.categories.length),
      label: b.categories.length === 1 ? "תחום פעילות" : "תחומי פעילות",
    });
  }
  if (b.serviceRadiusKm) {
    stats.push({ Icon: Route, value: `${b.serviceRadiusKm} ק״מ`, label: "רדיוס שירות" });
  }

  return stats.slice(0, 5);
}

function buildHighlights(b: Business): { Icon: Icon; label: string; sub?: string }[] {
  const items: { Icon: Icon; label: string; sub?: string }[] = [];

  if (b.acceptsOnlineBooking) items.push({ Icon: CalendarCheck, label: "הזמנה אונליין" });
  if (b.isMobileService) {
    items.push({
      Icon: Route,
      label: "מגיעים עד הלקוח",
      sub: b.serviceRadiusKm ? `עד ${b.serviceRadiusKm} ק״מ` : undefined,
    });
  }
  if (b.priceRange) {
    items.push({ Icon: Wallet, label: "₪".repeat(b.priceRange), sub: "רמת מחירים" });
  }
  for (const tag of b.tags ?? []) {
    items.push({ Icon: TagIcon, label: tag.name });
  }

  return items.slice(0, 4);
}

/* ============================================================================
   רכיבי עזר
   ============================================================================ */

function Panel({
  title, children, icon, className, id,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`h-fit rounded-xl border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(12,29,64,0.05)] sm:p-6 ${className ?? ""}`}
    >
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg text-ink-900">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactRow({
  icon, label, children,
}: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-ink-600">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink-50 text-brand-600">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-2xs text-ink-400">{label}</span>
        {children}
      </span>
    </li>
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
    image: b.coverUrl ?? b.logoUrl ?? undefined,
    logo: b.logoUrl ?? undefined,
    telephone: b.phone ?? undefined,
    email: b.email ?? undefined,
    foundingDate: b.foundedYear ? String(b.foundedYear) : undefined,
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
      dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
    />
  );
}
