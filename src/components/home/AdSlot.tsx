import { BannerCard } from "@/components/home/BannerCard";
import type { Banner } from "@/types/domain";

/**
 * משבצת פרסום בזרימת העמוד.
 *
 * כשאין באנר פעיל עם קריאייטיב — לא מוצג כלום. קודם הייתה כאן
 * מסגרת מקווקוות "מקום פנוי", מתוך רצון לשמור על רשת קבועה; בפועל
 * זה גורם לאתר להיראות כמו תבנית שלא מולאה. רשת שמתכווצת בהתאם
 * לתוכן שקיים נראית טוב יותר מרשת עם חורים.
 */
export function AdSlot({ banner, className }: { banner?: Banner; className?: string }) {
  if (!banner?.assetUrl) return null;
  return <BannerCard banner={banner} className={className} />;
}
