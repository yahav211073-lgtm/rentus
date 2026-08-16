import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { searchBusinesses } from "@/lib/repo/search";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { BusinessCard } from "@/components/business/BusinessCard";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CoverArt } from "@/components/ui/CoverArt";
import { decodeParam, formatNumber } from "@/lib/utils";

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
    description: category.description ?? `כל העסקים בתחום ${category.name} — במקום אחד.`,
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: { images: category.imageUrl ? [category.imageUrl] : undefined },
  };
}

export default async function CategoryPage({ params }: { params: Params }) {
  const { slug: rawSlug } = await params;
  const slug = decodeParam(rawSlug);
  const category = await findCategory(slug);
  if (!category) notFound();

  const result = await searchBusinesses({ category: slug, sort: "rating" });

  return (
    <div className="bg-ink-50 pb-20">
      <div className="relative isolate h-[260px] overflow-hidden sm:h-[320px]">
        {category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <CoverArt seed={category.slug} className="absolute inset-0 h-full w-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-950/60 to-brand-950/30" />

        <div className="relative mx-auto flex h-full max-w-[1480px] flex-col justify-end px-4 pb-8 sm:px-6 lg:px-8">
          <nav aria-label="פירורי לחם" className="mb-3 text-xs text-white/60">
            <Link href="/" className="hover:text-white">בית</Link>
            <span aria-hidden="true"> › </span>
            <span className="text-white/85">{category.name}</span>
          </nav>
          <h1 className="mb-2 font-display text-3xl font-extrabold text-white sm:text-4xl">{category.name}</h1>
          {category.description && (
            <p className="max-w-xl text-white/75">{category.description}</p>
          )}
          <p className="mt-2 text-sm font-semibold text-accent-400">
            {formatNumber(result.total)} עסקים פעילים בקטגוריה
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1480px] px-4 pt-8 sm:px-6 lg:px-8">
        {category.children && category.children.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            {category.children.map((sub) => (
              <Link
                key={sub.id}
                href={`/category/${sub.slug}`}
                className="rounded-full border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        {result.items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center sm:p-16">
            <h2 className="mb-2 font-display text-xl font-bold text-ink-900">עדיין אין עסקים בקטגוריה הזו</h2>
            <p className="mx-auto max-w-md text-base leading-relaxed text-ink-500">
              היו הראשונים — <Link href="/business/register" className="font-bold text-brand-700 hover:text-brand-500">רשמו את העסק שלכם</Link> בקטגוריה הזו.
            </p>
          </div>
        ) : (
          <RevealStagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {result.items.map((b) => (
              <RevealItem key={b.id}>
                <BusinessCard business={b} />
              </RevealItem>
            ))}
          </RevealStagger>
        )}
      </div>
    </div>
  );
}

export const dynamicParams = true;
