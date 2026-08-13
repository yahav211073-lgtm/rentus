import { Megaphone } from "lucide-react";
import Link from "next/link";
import { BannerCard } from "@/components/home/BannerCard";
import type { Banner } from "@/types/domain";

/**
 * משבצת פרסום. אם יש באנר פעיל היא מציגה אותו; אם לא, "מקום פנוי" —
 * כדי שרשת הפרסום תישאר קבועה ויזואלית גם לפני שיש מפרסמים בפועל,
 * ותהפוך למודעה אמיתית ברגע שמנהל יוסיף אחת דרך /admin/ads.
 */
export function AdSlot({ banner, className }: { banner?: Banner; className?: string }) {
  if (banner) return <BannerCard banner={banner} className={className} />;

  return (
    <Link
      href="/advertise"
      className={`group flex min-h-[280px] flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-200 bg-ink-50 p-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50 ${className ?? ""}`}
    >
      <Megaphone className="h-6 w-6 text-ink-300 transition-colors group-hover:text-brand-500" />
      <p className="text-sm font-bold text-ink-400 transition-colors group-hover:text-brand-600">מקום פנוי</p>
      <p className="text-xs text-ink-400">לפרסום כאן</p>
    </Link>
  );
}
