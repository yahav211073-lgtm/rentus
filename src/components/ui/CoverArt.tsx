import { cn } from "@/lib/utils";

/**
 * כיסוי גרפי דטרמיניסטי לעסק שאין לו עדיין תמונה.
 *
 * למה לא תמונת placeholder אחת אפורה לכולם: רשת של שנים עשר כרטיסים
 * עם אותו ריבוע אפור נראית שבורה. כאן כל עסק מקבל גרדיאנט משלו, נגזר
 * מה-slug שלו — כך שהוא יציב בין רינדורים (חשוב ל-SSR, אחרת יש
 * hydration mismatch) ושונה מהשכן שלו.
 *
 * ברגע שיש coverUrl אמיתי, הרכיב הזה לא נטען בכלל.
 */

/** hash יציב, 32 ביט. אותו קלט → תמיד אותו פלט, בשרת ובדפדפן. */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/* פלטת גרדיאנטים — כולה בתוך משפחת הצבעים של המותג.
   הגרסה הקודמת כללה גם סגול, טורקיז וירוק, וכשכמה כרטיסים בלי
   תמונה הופיעו זה ליד זה (למשל שני מדריכים בלי תמונת נושא) התוצאה
   נראתה כמו טעות ולא כמו החלטה. עכשיו כל הווריאציות הן גווני נייבי
   וכחול של המותג, עם יציאה חמה אחת בלבד — מספיק כדי שכרטיס לא
   ייראה זהה לשכן שלו, ולא מספיק כדי לשבור את הפלטה. */
const PALETTES: [string, string, string][] = [
  ["#0C1D40", "#1D3B78", "#4A6FB2"],
  ["#08132C", "#142B5C", "#7C97C9"],
  ["#050C1C", "#0C1D40", "#2A4F97"],
  ["#142B5C", "#2A4F97", "#7C97C9"],
  ["#0F172A", "#1E293B", "#475569"],
  ["#0C1D40", "#142B5C", "#94A3B8"],
  ["#08132C", "#1D3B78", "#AFC1DE"],
  ["#142B5C", "#963A06", "#F6741E"],
];

interface CoverArtProps {
  /** מזהה יציב — slug או id. קובע את הגרדיאנט. */
  seed: string;
  /** אות/ראשי תיבות שיוצגו במרכז. ברירת מחדל: האות הראשונה של seedLabel. */
  label?: string;
  className?: string;
  /** מצב עדין יותר, לרקעים קטנים כמו אווטאר */
  compact?: boolean;
}

export function CoverArt({ seed, label, className, compact = false }: CoverArtProps) {
  const h = hashString(seed);
  const [c1, c2, c3] = PALETTES[h % PALETTES.length];
  const angle = 100 + (h % 80);
  // מיקום הכתם הזוהר משתנה בין כרטיסים — מונע תחושת חזרתיות
  const blobX = 20 + (h % 60);
  const blobY = 15 + ((h >> 3) % 55);

  const initials = label ?? "";

  return (
    <div
      aria-hidden="true"
      className={cn("relative overflow-hidden isolate", className)}
      style={{ background: `linear-gradient(${angle}deg, ${c1}, ${c2} 55%, ${c3})` }}
    >
      {/* כתם אור רך */}
      <div
        className="absolute rounded-full blur-3xl opacity-45 mix-blend-screen"
        style={{
          background: c3,
          width: "70%",
          aspectRatio: "1",
          insetInlineStart: `${blobX}%`,
          top: `${blobY}%`,
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* רשת עדינה — נותנת מבנה ומונע תחושת "גרדיאנט ריק" */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(to left, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: compact ? "18px 18px" : "34px 34px",
        }}
      />

      {/* גרעיניות — SVG feTurbulence, לא קובץ תמונה */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.16]" aria-hidden="true">
        <filter id={`grain-${h % 8}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${h % 8})`} />
      </svg>

      {/* הצללה תחתונה — מבטיחה ניגודיות לטקסט שמונח מעל */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />

      {initials && (
        <span
          className={cn(
            "absolute inset-0 grid place-items-center font-display font-bold text-white/22 select-none",
            compact ? "text-2xl" : "text-6xl",
          )}
          style={{ letterSpacing: "-0.04em" }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
