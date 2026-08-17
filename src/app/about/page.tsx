import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { getBrandSettings } from "@/lib/repo/branding";
import { getAboutContent } from "@/lib/repo/settings";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  return { title: "אודות", description: `מי אנחנו ולמה ${brand.name} קיים.`, alternates: { canonical: "/about" } };
}

const ICONS = [BadgeCheck, ShieldCheck, MapPin, Sparkles];

export default async function AboutPage() {
  const [brand, about] = await Promise.all([getBrandSettings(), getAboutContent()]);

  return (
    <div className="bg-ink-50 pb-20">
      {/* --- הירו --- */}
      <div className="relative isolate h-[280px] overflow-hidden sm:h-[340px]">
        <Image
          src={brand.heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/92 via-brand-950/55 to-brand-950/35" />

        <div className="relative mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center sm:px-6">
          <h1 className="mb-3 font-display text-3xl font-extrabold text-white sm:text-4xl">
            אודות {brand.name}
          </h1>
          <p className="max-w-xl text-white/80">
            {brand.name} {about.intro}
          </p>
        </div>
      </div>

      {/* --- נקודות חוזק --- */}
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2">
          {about.points.map((point, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <div key={point.title} className="rounded-lg border border-ink-200/70 bg-white p-5 shadow-[0_1px_3px_rgba(11,59,117,0.06)]">
                <span className="mb-3 grid h-11 w-11 place-items-center rounded-full bg-brand-800/10 text-brand-700">
                  <Icon className="h-5.5 w-5.5" />
                </span>
                <h2 className="mb-1.5 font-bold text-ink-900">{point.title}</h2>
                <p className="text-sm leading-relaxed text-ink-500">{point.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
