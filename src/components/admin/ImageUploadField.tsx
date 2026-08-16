"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImageOff, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";
const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  /** שם השדה בטופס. הקובץ נשלח בשם הזה, ודגל המחיקה ב-`${name}Clear`. */
  name: string;
  label: string;
  hint?: string;
  /** התמונה השמורה כרגע, אם יש. */
  currentUrl?: string | null;
  required?: boolean;
  className?: string;
  /** יחס גובה-רוחב של התצוגה המקדימה, למשל "16/9" או "1/1". */
  aspect?: string;
}

/**
 * שדה תמונה לטפסי ניהול.
 *
 * העלאה מהמכשיר היא הדרך היחידה. אין כאן שדה "הדביקו כתובת" בכוונה:
 * הוא היה קיים, ובפועל הודבקו לתוכו נתיבי `file:///` מהמחשב — שנשמרו
 * במסד בהצלחה אבל היו תמונה שבורה אצל כל גולש. שדה שאפשר להשתמש
 * בו לא נכון בקלות הוא שדה שישתמשו בו לא נכון.
 *
 * הוולידציה כאן היא נוחות בלבד (משוב מיידי); האכיפה האמיתית היא
 * בשרת ב-lib/uploads.ts, כי כל בדיקה בדפדפן ניתנת לעקיפה.
 */
export function ImageUploadField({
  name, label, hint, currentUrl, required, className, aspect = "16/9",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);

  // כתובת ה-blob של התצוגה המקדימה חייבת להשתחרר, אחרת כל בחירת
  // קובץ מדליפה את הקובץ הקודם לזיכרון עד ריענון העמוד.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function onPick(file: File | undefined) {
    setError(null);
    if (!file) return;

    if (!ACCEPT.split(",").includes(file.type)) {
      setError("אפשר להעלות JPG, PNG, WebP או AVIF בלבד.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("גודל התמונה המירבי הוא 5MB.");
      return;
    }

    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setCleared(false);
  }

  function clear() {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName(null);
    setError(null);
    setCleared(Boolean(currentUrl));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={inputId} className="text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>

      <div className="flex items-start gap-3">
        <div
          className="relative w-28 shrink-0 overflow-hidden rounded-sm border border-ink-200 bg-ink-50"
          style={{ aspectRatio: aspect }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-ink-300">
              <ImageOff className="h-5 w-5" aria-hidden="true" />
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap gap-2">
            <label
              htmlFor={inputId}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xs border border-dashed border-ink-300 bg-white px-3 text-xs font-bold text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
            >
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              {preview ? "החלפת תמונה" : "בחירת תמונה מהמכשיר"}
            </label>

            {preview && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-xs font-bold text-ink-500 transition-colors hover:bg-danger-50 hover:text-danger-500"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                הסרה
              </button>
            )}
          </div>

          <p className="truncate text-2xs text-ink-400">
            {fileName ?? hint ?? "JPG, PNG, WebP או AVIF · עד 5MB"}
          </p>

          {error && (
            <p role="alert" className="text-2xs font-semibold text-danger-500">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="file"
        accept={ACCEPT}
        required={required && !currentUrl}
        onChange={(e) => onPick(e.target.files?.[0])}
        className="sr-only"
      />
      {/* דגל מחיקה — מבדיל בין "לא נגעתי בשדה" (משאירים) לבין
          "הסרתי את התמונה" (מאפסים במסד). */}
      {cleared && <input type="hidden" name={`${name}Clear`} value="1" />}
    </div>
  );
}
