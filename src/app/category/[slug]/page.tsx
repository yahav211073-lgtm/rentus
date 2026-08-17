import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { searchBusinesses } from "@/lib/repo/search";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { BusinessCard } from "@/components/business/BusinessCard";
import { RevealItem, RevealStagger } from "@/components/motion/Reveal";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { GuidesSidebar } from "@/components/home/GuidesSidebar";
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
    description: category.description ?? `כל החברות בתחום ${category.name} — במקום אחד.`,
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(74,111,178,.55),transparent_32%),linear-gradient(135deg,#050c1c,#142b5c)]" />
        <div className="absolute left-[8%] top-1/2 grid h-40 w-40 -translate-y-1/2 place-items-center rounded-[2rem] border border-white/10 bg-white/5 text-white/20 sm:h-52 sm:w-52">
          <CategoryIcon name={category.icon} className="h-20 w-20 sm:h-28 sm:w-28" strokeWidth={1.2} />
        </div>

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
            {result.total === 1 ? "חברה פעילה אחת בקטגוריה" : `${formatNumber(result.total)} חברות פעילות בקטגוריה`}
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

        <div className="flex gap-7">
          <div className="min-w-0 flex-1">
            {result.items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-ink-300 bg-white p-10 text-center sm:p-16">
                <h2 className="mb-2 font-display text-xl font-bold text-ink-900">עדיין אין חברות בקטגוריה הזו</h2>
                <p className="mx-auto max-w-md text-base leading-relaxed text-ink-500">
                  היו הראשונים — <Link href="/business/register" className="font-bold text-brand-700 hover:text-brand-500">רשמו את החברה שלכם</Link> בקטגוריה הזו.
                </p>
              </div>
            ) : (
              <RevealStagger className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {result.items.map((b, i) => (
                  <RevealItem key={b.id}>
                    <BusinessCard business={b} priority={i === 0} />
                  </RevealItem>
                ))}
              </RevealStagger>
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

export const dynamicParams = true;
