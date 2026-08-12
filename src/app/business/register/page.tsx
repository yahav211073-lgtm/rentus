import type { Metadata } from "next";
import Link from "next/link";
import { MessageCircle, UserPlus } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { BusinessCta } from "@/components/home/BusinessCta";
import { RegisterBusinessForm } from "@/components/business/RegisterBusinessForm";
import { getCurrentUser } from "@/lib/auth";
import { getContactDetails } from "@/lib/repo/settings";
import { getFlatCategories, getCities } from "@/lib/repo/taxonomy";
import { toWhatsAppNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "רישום עסק חינם",
  description: "פרסמו את העסק שלכם באינדקס — פרופיל בסיסי ללא עלות, אישור תוך יום עסקים אחד.",
};

/**
 * הרשמת עסק. שני מסלולים, כמו שביקשת: מילוי טופס (הולך לתור אישור
 * מנהל, status='pending'), או פנייה ישירה בוואטסאפ בלי טופס בכלל.
 * הטופס דורש חשבון מחובר — כי owner_id נקבע מהסשן (0011_rls),
 * לא משדה בטופס שאפשר לזייף.
 *
 * סקציית השכנוע (BusinessCta) עברה לכאן מעמוד הבית בכוונה — עמוד
 * הבית מציג עסקים, לא מוכר רישום. זה העמוד היחיד שאמור לשכנע.
 */
export default async function BusinessRegisterPage() {
  const [user, contact, categories, cities] = await Promise.all([
    getCurrentUser(),
    getContactDetails(),
    getFlatCategories(),
    getCities(),
  ]);

  const whatsappHref = `https://wa.me/${toWhatsAppNumber(contact.whatsapp)}?text=${encodeURIComponent("היי, אני רוצה לרשום את העסק שלי באינדקס")}`;

  return (
    <>
      <BusinessCta />

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-display text-3xl font-extrabold text-ink-900">רישום העסק שלכם</h1>
          <p className="text-ink-500">
            פרופיל בסיסי ללא עלות. הטופס נבדק ידנית ומאושר תוך יום עסקים אחד.
          </p>
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-8 flex items-center justify-between gap-4 border border-success-500/30 bg-success-50 p-5 transition-colors hover:border-success-500/50"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#25D366]/15">
              <MessageCircle className="h-5.5 w-5.5 text-[#25D366]" />
            </span>
            <div>
              <p className="font-bold text-ink-900">לא מתחשק למלא טופס?</p>
              <p className="text-sm text-ink-500">דברו איתנו בוואטסאפ ונרשום אתכם ידנית</p>
            </div>
          </div>
          <span className="shrink-0 text-sm font-bold text-success-500">פתיחת צ׳אט ←</span>
        </a>

        {user ? (
          <RegisterBusinessForm categories={categories} cities={cities} />
        ) : (
          <div className="border border-ink-200/70 bg-white p-7 text-center">
            <UserPlus className="mx-auto mb-3 h-9 w-9 text-brand-600" />
            <h2 className="mb-1.5 font-display text-lg font-bold text-ink-900">קודם צריך חשבון</h2>
            <p className="mb-5 text-sm leading-relaxed text-ink-600">
              כדי שהעסק ישויך אליכם ותוכלו לנהל אותו בהמשך, צריך להתחבר או להירשם קודם. לוקח דקה.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5">
              <ButtonLink href="/signup?next=/business/register" variant="primary" size="lg">
                יצירת חשבון
              </ButtonLink>
              <ButtonLink href="/login?next=/business/register" variant="secondary" size="lg">
                יש לי כבר חשבון
              </ButtonLink>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-ink-400">
          בעל עסק קיים? <Link href="/business/login" className="font-bold text-brand-700 hover:text-brand-500">כניסה לניהול העסק</Link>
        </p>
      </div>
    </>
  );
}
