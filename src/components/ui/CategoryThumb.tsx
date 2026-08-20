import Image from "next/image";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { cn } from "@/lib/utils";

/**
 * הייצוג הוויזואלי של קטגוריה — תמונה אם יש, אייקון אם אין.
 *
 * הרכיב הזה קיים כדי לסגור באג אמיתי: תמונת קטגוריה שהוגדרה בניהול
 * הופיעה רק ברצועת עמוד הבית. שלושת המקומות האחרים שמציגים קטגוריה
 * (עמוד הקטגוריות, הקרוסלה, ורצועת הקטגוריות המורחבת) קיבלו את
 * imageUrl כ-prop, התעלמו ממנו לחלוטין וציירו CategoryIcon בלבד.
 * מבחינת המנהל זה נראה כמו "השינוי לא נשמר", בעוד שהנתון נשמר מצוין
 * ופשוט לא רונדר.
 *
 * לכן ההחלטה "תמונה או אייקון" יושבת כאן ולא בכל אתר קריאה: מקור
 * אמת אחד בנתונים ראוי למקור אמת אחד ברינדור, אחרת אותו באג פשוט
 * חוזר במקום הרביעי.
 *
 * `tone` קובע רק את מראה הנפילה-לאייקון: "light" למשטח לבן,
 * "dark" לכרטיס כהה עם זכוכית.
 */
export function CategoryThumb({
  imageUrl, icon, name, className, iconClassName, tone = "light", sizes = "64px",
}: {
  imageUrl?: string | null;
  icon?: string | null;
  /** לטקסט חלופי. ריק בכוונה כשהתמונה דקורטיבית לצד שם הקטגוריה. */
  name?: string;
  className?: string;
  iconClassName?: string;
  tone?: "light" | "dark";
  sizes?: string;
}) {
  if (imageUrl) {
    return (
      <span className={cn("relative block overflow-hidden", className)}>
        <Image
          src={imageUrl}
          alt={name ? `${name}` : ""}
          fill
          sizes={sizes}
          className="object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "grid place-items-center",
        tone === "dark"
          ? "border border-white/15 bg-white/10 text-white backdrop-blur-sm"
          : "bg-brand-50 text-brand-700",
        className,
      )}
    >
      <CategoryIcon name={icon} className={iconClassName ?? "h-6 w-6"} strokeWidth={1.8} />
    </span>
  );
}
