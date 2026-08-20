import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SlidersHorizontal, Store } from "lucide-react";
import { searchBusinesses } from "@/lib/repo/search";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getAreas } from "@/lib/repo/taxonomy";
import { BusinessCard } from "@/components/business/BusinessCard";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ButtonLink } from "@/components/ui/Button";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
import { env } from "@/lib/env";
import { decodeParam, formatNumber, jsonLd } from "@/lib/utils";

/**
 * עמוד קטגוריה.
 *
 * ההירו נשען על התמונה האמיתית של הקטגוריה (categories.image_url,
 * נערכת באדמין) ולא על גרדיאנט מופשט עם אייקון ענק. קטגוריה בלי
 * תמונה עדיין מקבלת את הגרסה המופשטת — כך שהעמוד לא נשבר, וגם ברור
 * למנהל איפה חסרה תמונה.
 *
 * המסננים כאן הם קיצורי דרך ל-/search ולא מערכת סינון שנייה. עמוד
 * הקטגוריה עונה על "מי עוסק בזה"; ההצטלבויות המורכבות (דירוג, מאפיינים,
 * מיון) חיות במסך אחד, ושכפול שלהן היה יוצר שתי מערכות שמתפצלות.
 */

type Params = Promise<{ slug: string }>;

async function findCategory(slug: string) {
  const categories = await getCategoriesWithCounts();
  const flat = categories.flatMap((c) => [c, ...(c.children ?? [])]);
  return flat.find((c) => c.slug === slug) ?? null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const category = await findCategory(slug);
  if (!category) return { title: "הקטגוריה לא נמצאה" };

  return {
    title: category.name,
    description:
      category.description ??
      `כל החברות בתחום ${category.name} — פרטי קשר, דירוגים וביקורות אמיתיות, במקום אחד.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { images: category.imageUrl ? [category.imageUrl] : undefined },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const category = await findCategory(slug);
  if (!category) notFound();

  const [result, allCategories, areas] = await Promise.all([
    searchBusinesses({ category: slug, sort: "rating" }),
    getCategoriesWithCounts(),
    getAreas(),
  ]);

  const siblings = allCategories
    .flatMap((c) => [c, ...(c.children ?? [])])
    .filter((c) => c.slug !== category.slug)
    .slice(0, 8);

  return (
    <div className="bg-ink-50 pb-20">
      <JsonLd category={category.name} slug={category.slug} count={result.total} />

      {/* --- הירו --- */}
      <header className="relative isolate h-[240px] overflow-hidden sm:h-[300px]">
        {category.imageUrl ? (
          <>
            <Image
              src={category.imageUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, rgba(5,12,28,0.94), rgba(5,12,28,0.72) 55%, rgba(5,12,28,0.55))",
              }}
              aria-hidden="true"
            />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(74,111,178,.55),transparent_32%),linear-gradient(135deg,#050c1c,#142b5c)]" />
            <div
              className="absolute top-1/2 grid h-40 w-40 -translate-y-1/2 place-items-center rounded-[2rem] border border-white/10 bg-white/5 text-white/20 sm:h-52 sm:w-52"
              style={{ insetInlineEnd: "8%" }}
              aria-hidden="true"
            >
              <CategoryIcon name={category.icon} className="h-20 w-20 sm:h-28 sm:w-28" strokeWidth={1.2} />
            </div>
          </>
        )}

        <div className="relative mx-auto flex h-full max-w-[1480px] flex-col justify-end px-4 pb-8 sm:px-6 lg:px-8">
          <nav aria-label="פירורי לחם" className="mb-3 text-xs text-white/60">
            <Link href="/" className="transition-colors hover:text-white">דף הבית</Link>
            <span aria-hidden="true"> › </span>
            <Link href="/categories" className="transition-colors hover:text-white">קטגוריות</Link>
            <span aria-hidden="true"> › </span>
            <span className="text-white/85">{category.name}</span>
          </nav>

          <h1 className="font-display text-3xl text-white sm:text-4xl">
            השכרת {category.name}
          </h1>
          {category.description && (
            <p className="mt-2 max-w-xl leading-relaxed text-white/75">{category.description}</p>
          )}
          <p className="mt-2.5 text-sm font-bold text-white/90">
            {result.total === 0
              ? "אין עדיין חברות פעילות בקטגוריה"
              : result.total === 1
                ? "חברה פעילה אחת בקטגוריה"
                : `${formatNumber(result.total)} חברות פעילות בקטגוריה`}
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-[1480px] px-4 pt-7 sm:px-6 lg:px-8">
        {/* --- תת-קטגוריות --- */}
        {category.children && category.children.length > 0 && (
          <nav aria-label="תת-קטגוריות" className="mb-6 flex flex-wrap gap-2">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {sub.name}
              </Link>
            ))}
          </nav>
        )}

        {/* --- סינון מהיר לפי אזור --- */}
        {result.total > 0 && areas.length > 0 && (
          <div className="mb-7 flex flex-wrap items-center gap-2 rounded-lg border border-ink-200/70 bg-white p-3.5">
            <span className="inline-flex items-center gap-1.5 pe-1 text-xs font-bold text-ink-500">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              סינון לפי אזור:
            </span>
            {areas.map((area) => (
              <Link
                key={area.slug}
                href={`/search?category=${category.slug}&area=${area.slug}`}
                className="rounded-full bg-ink-50 px-3 py-1.5 text-xs font-semibold text-ink-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
              >
                {area.name}
              </Link>
            ))}
            <Link
              href={`/search?category=${category.slug}`}
              className="ms-auto text-xs font-bold text-brand-700 transition-colors hover:text-brand-500"
            >
              כל המסננים ←
            </Link>
          </div>
        )}

        <div className="flex gap-7">
          <div className="min-w-0 flex-1">
            {result.items.length === 0 ? (
              <EmptyState
                className="bg-white"
                icon={<Store className="h-6 w-6" />}
                title={`עדיין אין חברות בתחום ${category.name}`}
                description="הקטגוריה פתוחה לרישום. חברה שנרשמת עכשיו תהיה הראשונה שמופיעה כאן."
                action={
                  <ButtonLink href="/business/register" variant="accent" size="md">
                    רישום החברה שלי
                  </ButtonLink>
                }
              />
            ) : (
              <RevealStagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((b, i) => (
                  <RevealItem key={b.id}>
                    <BusinessCard business={b} priority={i === 0} />
                  </RevealItem>
                ))}
              </RevealStagger>
            )}

            {/* --- קטגוריות קשורות --- */}
            {siblings.length > 0 && (
              <section className="mt-14">
                <h2 className="mb-4 font-display text-xl text-ink-900">
                  תחומים נוספים
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {siblings.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/category/${c.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                      >
                        <CategoryIcon name={c.icon} className="h-4 w-4 text-brand-600" />
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="hidden lg:block lg:w-[320px] lg:shrink-0">
            <div className="sticky top-[calc(var(--spacing-header)+16px)]">
              <GuidesSidebar />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * CollectionPage + BreadcrumbList.
 *
 * אין כאן ItemList עם דירוגים: סימון aggregateRating ברמת הרשימה
 * הוא בדיוק סוג הסימון שגוגל מתייחס אליו כספאם כשהוא לא מלווה
 * בעמוד ייעודי לכל פריט. הדירוגים מסומנים בעמוד העסק עצמו.
 */
function JsonLd({ category, slug, count }: { category: string; slug: string; count: number }) {
  const url = `${env.siteUrl}/category/${slug}`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": url,
        url,
        name: `השכרת ${category}`,
        inLanguage: "he-IL",
        ...(count > 0
          ? { mainEntity: { "@type": "ItemList", numberOfItems: count } }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "בית", item: env.siteUrl },
          { "@type": "ListItem", position: 2, name: "קטגוריות", item: `${env.siteUrl}/categories` },
          { "@type": "ListItem", position: 3, name: category, item: url },
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

export const dynamicParams = true;
