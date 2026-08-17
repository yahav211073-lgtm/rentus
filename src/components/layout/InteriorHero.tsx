import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface InteriorHeroProps {
  title: string;
  description?: string;
  imageUrl?: string;
  eyebrow?: string;
  action?: { label: string; href: string };
  compact?: boolean;
}

/** כותרת פנימית אחידה שממשיכה את הבמה הכחולה של עמוד הבית. */
export function InteriorHero({
  title, description, imageUrl = "/images/hero-stage.jpg", eyebrow, action, compact = false,
}: InteriorHeroProps) {
  return (
    <section className={`relative isolate overflow-hidden bg-brand-950 ${compact ? "py-10 sm:py-12" : "py-14 sm:py-18"}`}>
      <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,28,.96),rgba(8,25,62,.86),rgba(5,12,28,.92))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(30,85,190,.3),transparent_42%)]" />

      <div className="relative mx-auto flex max-w-[1480px] flex-col gap-5 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-2 text-xs font-bold tracking-wide text-accent-300">{eyebrow}</p>}
          <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl">{title}</h1>
          {description && <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/72 sm:text-lg">{description}</p>}
        </div>
        {action && (
          <Link href={action.href} className="inline-flex h-11 shrink-0 items-center gap-2 self-start rounded-sm bg-white px-5 text-sm font-bold text-brand-800 shadow-lg transition-transform hover:-translate-y-0.5 lg:self-auto">
            {action.label}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}
