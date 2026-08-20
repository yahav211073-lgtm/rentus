import { BannerCard } from "@/components/home/BannerCard";
import { HouseAd } from "@/components/ads/HouseAd";
import type { Banner } from "@/types/domain";

/**
 * משבצת פרסום בזרימת העמוד.
 *
 * כשאין באנר פעיל עם קריאייטיב, המשבצת לא נעלמת אלא מציגה את
 * קריאייטיב הבית של רנטוס ("יש לכם מודעה לפרסם?"). בעל האתר מחליף
 * אותו בקריאייטיב של מפרסם דרך הניהול — כלומר כל משבצת מוכרת את
 * עצמה כל עוד היא לא נמכרה.
 */
export function AdSlot({
  banner,
  variant = "square",
  className,
}: {
  banner?: Banner;
  variant?: "square" | "wide" | "compact";
  className?: string;
}) {
  if (!banner?.assetUrl) return <HouseAd variant={variant} className={className} />;
  return <BannerCard banner={banner} compact={variant === "compact"} className={className} />;
}
