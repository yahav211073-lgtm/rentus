"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, BadgeCheck, Check, Star, Trash2, X } from "lucide-react";
import {
  approveBusiness, deleteBusinessAdmin, rejectBusiness, setBusinessArchived,
  setBusinessFeatured, setBusinessVerified,
} from "@/app/admin/businesses/actions";

export function ApproveRejectButtons({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="סיבת דחייה..."
          className="h-8 w-36 rounded-xs border border-ink-200 px-2 text-xs outline-none focus:border-brand-400"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await rejectBusiness(businessId, reason); })}
          className="rounded-xs bg-danger-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-danger-500/90 disabled:opacity-50"
        >
          אישור דחייה
        </button>
        <button
          type="button"
          onClick={() => setRejecting(false)}
          className="text-xs text-ink-400 hover:text-ink-700"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await approveBusiness(businessId); })}
        className="inline-flex items-center gap-1 rounded-xs bg-success-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-success-500/90 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> אישור
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="inline-flex items-center gap-1 rounded-xs border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> דחייה
      </button>
    </div>
  );
}

export function ArchiveToggleButton({ businessId, isArchived }: { businessId: string; isArchived: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await setBusinessArchived(businessId, !isArchived); })}
      className="inline-flex items-center gap-1 rounded-xs border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
    >
      {isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
      {isArchived ? "שחזור" : "העברה לארכיון"}
    </button>
  );
}

/**
 * מתגי "מומלץ" ו"מאומת" ישירות מהרשימה.
 *
 * שני מתגים ולא תפריט: אלה שתי ההחלטות שמנהל מקבל הכי הרבה פעמים
 * ביום, והן אמורות לעלות קליק אחד. המתג מציג את המצב הנוכחי בצבע
 * מלא ואת המצב הכבוי במסגרת בלבד, כדי שסריקה של הטבלה תראה מיד מי
 * מקודם ומי מאומת.
 *
 * כישלון אימות אינו שקט: העסק חייב פרטים מלאים כדי להיות מאומת,
 * והשרת מחזיר בדיוק מה חסר. ההודעה מוצגת ליד המתג ולא נעלמת מעצמה.
 */
export function FeatureVerifyToggles({
  businessId, isFeatured, isVerified,
}: { businessId: string; isFeatured: boolean; isVerified: boolean }) {
  const [pending, startTransition] = useTransition();
  const [featured, setFeatured] = useState(isFeatured);
  const [verified, setVerified] = useState(isVerified);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={pending}
          aria-pressed={featured}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const next = !featured;
              const res = await setBusinessFeatured(businessId, next);
              if (res.ok) setFeatured(next);
              else setError(res.error ?? "הפעולה נכשלה.");
            })
          }
          className={`inline-flex items-center gap-1 rounded-xs border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
            featured
              ? "border-accent-500 bg-accent-500 text-white"
              : "border-ink-200 text-ink-500 hover:border-accent-300 hover:text-accent-700"
          }`}
        >
          <Star className={`h-3.5 w-3.5 ${featured ? "fill-current" : ""}`} aria-hidden="true" />
          מומלץ
        </button>

        <button
          type="button"
          disabled={pending}
          aria-pressed={verified}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const next = !verified;
              const res = await setBusinessVerified(businessId, next);
              if (res.ok) setVerified(next);
              else setError(res.error ?? "הפעולה נכשלה.");
            })
          }
          className={`inline-flex items-center gap-1 rounded-xs border px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 ${
            verified
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-ink-200 text-ink-500 hover:border-brand-300 hover:text-brand-700"
          }`}
        >
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
          מאומת
        </button>
      </div>

      {error && (
        <p role="alert" className="max-w-[220px] text-2xs font-semibold text-danger-500">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * מחיקה מוחלטת של עסק.
 *
 * שני שלבים: לחיצה פותחת שדה שדורש להקליד את שם העסק במדויק.
 * לא window.confirm — דיאלוג "בטוח?" נלחץ אוטומטית אחרי הפעם
 * השלישית, והקלדת השם מכריחה לקרוא מה עומד להימחק. אותה בדיקה
 * חוזרת גם בשרת, כי ולידציה בדפדפן היא נוחות ולא הגנה.
 *
 * הכפתור עצמו מוצג רק למנהל ראשי — הפעולה בשרת דוחה כל תפקיד אחר,
 * וכפתור שתמיד נכשל גרוע מכפתור שלא קיים.
 */
export function DeleteBusinessButton({
  businessId, businessName, isAdmin,
}: { businessId: string; businessName: string; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  if (!isAdmin) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-xs border border-danger-500/40 px-2.5 py-1.5 text-xs font-bold text-danger-700 transition-colors hover:bg-danger-50"
      >
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        מחיקה
      </button>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1.5">
      <span className="text-2xs leading-snug text-danger-700">
        מחיקה בלתי הפיכה. הקלידו <b>{businessName}</b> לאישור.
      </span>
      <span className="inline-flex items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(""); }}
          aria-label={`אישור מחיקת ${businessName}`}
          className="h-8 w-40 rounded-xs border border-danger-500/40 px-2 text-xs outline-none focus:border-danger-500"
        />
        <button
          type="button"
          disabled={pending || value.trim() !== businessName.trim()}
          onClick={() => startTransition(async () => {
            const res = await deleteBusinessAdmin(businessId, value);
            if (!res.ok) setError(res.error);
          })}
          className="rounded-xs bg-danger-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-danger-700 disabled:opacity-40"
        >
          מחק
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setValue(""); setError(""); }}
          className="rounded-xs px-2 py-1.5 text-xs font-bold text-ink-500 hover:text-ink-800"
        >
          ביטול
        </button>
      </span>
      {error && <span role="alert" className="text-2xs font-semibold text-danger-700">{error}</span>}
    </span>
  );
}
