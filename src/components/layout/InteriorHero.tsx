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
    /* py-8 במובייל: הכותרת הפנימית היא שלט, לא במה. 56px ריפוד
       מלמעלה ומלמטה סביב כותרת של שתי שורות דחפו את התוכן האמיתי
       של העמוד אל מתחת לקיפול בכל עמוד פנימי באתר. */
    <section className={`relative isolate overflow-hidden bg-brand-950 ${compact ? "py-7 sm:py-10 lg:py-12" : "py-8 sm:py-14 lg:py-18"}`}>
      <Image src={imageUrl} alt="" fill priority sizes="100vw" className="object-cover opacity-35" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,12,28,.96),rgba(8,25,62,.86),rgba(5,12,28,.92))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(30,85,190,.3),transparent_42%)]" />

      <div className="relative mx-auto flex max-w-[1480px] flex-col gap-4 px-4 sm:gap-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div className="max-w-3xl">
          {eyebrow && <p className="mb-1.5 text-2xs font-bold tracking-wide text-accent-300 sm:mb-2 sm:text-xs">{eyebrow}</p>}
          <h1 className="font-display text-2xl leading-tight text-white sm:text-3xl lg:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/72 sm:mt-3 sm:text-base lg:text-lg">{description}</p>}
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
