"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { updateBusinessLogo } from "@/app/admin/businesses/actions";

/**
 * החלפת לוגו לעסק קיים.
 *
 * טופס בפני עצמו ולא חלק מטופס העריכה הגדול: קובץ דורש FormData,
 * והעלאה היא פעולה שרוצים לראות שהצליחה מיד — לא אחרי שמירה של
 * עשרים שדות אחרים.
 */
export function BusinessLogoField({
  businessId, currentUrl,
}: { businessId: string; currentUrl: string | null }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(async () => {
          setError("");
          setSaved(false);
          const res = await updateBusinessLogo(businessId, fd);
          if (res.ok) setSaved(true);
          else setError(res.error ?? "ההעלאה נכשלה.");
        });
      }}
    >
      <ImageUploadField
        name="logo"
        label="לוגו"
        aspect="1/1"
        currentUrl={currentUrl}
        hint="מופיע בכל כרטיס של העסק באתר. עדיף PNG עם רקע שקוף. בלי לוגו העסק לא יכול להיות מאומת."
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="secondary" size="md" loading={pending}>
          שמירת הלוגו
        </Button>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-success-500">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> נשמר
          </span>
        )}
        {error && <span role="alert" className="text-sm font-semibold text-danger-500">{error}</span>}
      </div>
    </form>
  );
}
