import { Globe, Phone } from "lucide-react";
import {
  FacebookIcon, InstagramIcon, TikTokIcon, WhatsAppIcon, YouTubeIcon,
} from "@/components/ui/icons";
import { toWhatsAppNumber } from "@/lib/utils";

/**
 * כפתורי הרשתות של עסק.
 *
 * העיקרון היחיד כאן: רשת שלא הוגדרה לא מוצגת. כפתור אינסטגרם שמוביל
 * ל-"#" גרוע מהיעדר כפתור — הוא נראה כמו הבטחה, ומרגיש כמו אתר שבור
 * ברגע שלוחצים עליו.
 *
 * וואטסאפ מקבל את הצבע והסמל המקוריים שלו כי זה מה שגורם לו להיות
 * מזוהה במבט חטוף; שאר הרשתות ניטרליות כדי שהשורה לא תיראה כמו
 * קופסת גלידה.
 */
export interface BusinessSocial {
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  social?: Record<string, string>;
}

const NETWORKS = [
  { key: "instagram", label: "אינסטגרם", Icon: InstagramIcon },
  { key: "facebook", label: "פייסבוק", Icon: FacebookIcon },
  { key: "tiktok", label: "טיקטוק", Icon: TikTokIcon },
  { key: "youtube", label: "יוטיוב", Icon: YouTubeIcon },
] as const;

function isWebUrl(value?: string | null) {
  return Boolean(value && /^https?:\/\//i.test(value.trim()));
}

export function SocialLinks({ business, className }: { business: BusinessSocial; className?: string }) {
  const social = business.social ?? {};
  const networks = NETWORKS.filter((n) => isWebUrl(social[n.key]));

  const hasAny =
    Boolean(business.whatsapp) || Boolean(business.phone) ||
    isWebUrl(business.website) || networks.length > 0;

  if (!hasAny) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      {business.whatsapp && (
        <a
          href={`https://wa.me/${toWhatsAppNumber(business.whatsapp)}`}
          target="_blank" rel="noopener noreferrer"
          aria-label="שליחת הודעה בוואטסאפ"
          className="grid h-10 w-10 place-items-center rounded-xs border border-[#25D366]/40 bg-[#25D366]/10 text-[#128C7E] transition-colors hover:bg-[#25D366] hover:text-white"
        >
          <WhatsAppIcon className="h-4.5 w-4.5" />
        </a>
      )}

      {business.phone && (
        <a
          href={`tel:${business.phone}`}
          aria-label="חיוג לחברה"
          className="grid h-10 w-10 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          <Phone className="h-4.5 w-4.5" aria-hidden="true" />
        </a>
      )}

      {networks.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={social[key]}
          target="_blank" rel="noopener noreferrer"
          aria-label={label}
          className="grid h-10 w-10 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          <Icon className="h-4.5 w-4.5" />
        </a>
      ))}

      {isWebUrl(business.website) && (
        <a
          href={business.website!}
          target="_blank" rel="noopener noreferrer nofollow"
          aria-label="אתר החברה"
          className="grid h-10 w-10 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
        >
          <Globe className="h-4.5 w-4.5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
