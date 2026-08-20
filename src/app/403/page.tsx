import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = { title: "אין הרשאה", robots: { index: false, follow: false } };

export default function ForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <ShieldAlert className="mb-4 h-12 w-12 text-danger-500" />
      <h1 className="mb-2 font-display text-xl text-ink-900">אין לכם הרשאה לעמוד הזה</h1>
      <p className="mb-6 text-sm leading-relaxed text-ink-600">
        החשבון שלכם מחובר, אבל לא מוגדר עם ההרשאות הדרושות. אם זו טעות, פנו למנהל המערכת.
      </p>
      <ButtonLink href="/" variant="primary" size="md">חזרה לעמוד הבית</ButtonLink>
    </div>
  );
}
