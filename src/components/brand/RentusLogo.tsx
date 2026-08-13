import { cn } from "@/lib/utils";

/**
 * הלוגו של Rentus — שחזור וקטורי של הלוגו מהרפרנס:
 * סימן "R" כחול מודרני בנוי משני משיחים אלכסוניים + שם המותג
 * באותיות לטיניות כחולות מודגשות, ותת-שורה בעברית.
 *
 * אין קובץ לוגו אמיתי ברפוזיטורי (רק אייקוני ברירת מחדל של Next),
 * ולכן הסימן מצויר כ-SVG עצמאי לשימוש חוזר. אם יוגדר logoUrl
 * בהגדרות המותג — ההדר מציג אותו במקום הרכיב הזה.
 */
export function RentusMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 44 44"
      className={className}
      role="img"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id="rentus-mark-g" x1="6" y1="4" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2D7BF6" />
          <stop offset="1" stopColor="#0D3FA8" />
        </linearGradient>
      </defs>
      {/* הרגל האנכית של ה-R */}
      <path d="M9 4h9v36H9z" fill="url(#rentus-mark-g)" />
      {/* הקשת העליונה */}
      <path
        d="M18 4h8c7.2 0 12 4.4 12 10.6 0 5-3 8.6-7.6 10L38 40h-10l-6.4-14H18v-8h7.4c2.6 0 4.2-1.4 4.2-3.4S28 11 25.4 11H18V4z"
        fill="url(#rentus-mark-g)"
      />
    </svg>
  );
}

export function RentusLogo({
  brandName,
  tagline = "ציוד לאירועים. עבודה. תעשייה",
  className,
}: {
  brandName: string;
  tagline?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <RentusMark className="h-10 w-10 shrink-0" />
      <span className="flex flex-col leading-none">
        <span
          className="font-display text-[26px] font-black tracking-tight text-[#1D4ED8]"
          dir="ltr"
        >
          {brandName.toUpperCase()}
        </span>
        <span className="mt-1 text-[11px] font-medium text-ink-500">{tagline}</span>
      </span>
    </span>
  );
}
