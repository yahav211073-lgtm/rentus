import Link from "next/link";
import { Phone } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toWhatsAppNumber } from "@/lib/utils";

export const metadata = { title: "פניות", robots: { index: false, follow: false } };

/**
 * תיבת פניות גלובלית — כל הפניות מכל העסקים במקום אחד, כדי שאפשר
 * יהיה לעבוד עם הזרימה: פנייה מגיעה → לוקחים את הטלפון → מדברים עם
 * הלקוח → (אם צריך) בונים לו עסק דרך /admin/businesses/new.
 */
export default async function AdminLeadsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: leads } = await supabase!
    .from("leads")
    .select("id, name, phone, email, message, channel, status, created_at, business:businesses(id, name, slug)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink-900">פניות</h1>
      <p className="mb-6 text-sm text-ink-500">כל הפניות שהתקבלו דרך טפסי יצירת הקשר בעמודי העסקים.</p>

      <div className="overflow-hidden rounded-lg border border-ink-200/70 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
            <tr>
              <th className="px-4 py-3 text-start font-bold">תאריך</th>
              <th className="px-4 py-3 text-start font-bold">שם</th>
              <th className="px-4 py-3 text-start font-bold">טלפון</th>
              <th className="px-4 py-3 text-start font-bold">הודעה</th>
              <th className="px-4 py-3 text-start font-bold">עסק</th>
              <th className="px-4 py-3 text-start font-bold">יצירת קשר</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {(leads ?? []).map((l) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const business = l.business as any;
              return (
                <tr key={l.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-400">
                    {new Date(l.created_at).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-4 py-3 font-bold text-ink-800">{l.name ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-600">{l.phone ?? "—"}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink-500">{l.message ?? "—"}</td>
                  <td className="px-4 py-3">
                    {business ? (
                      <Link href={`/business/${business.slug}`} className="font-semibold text-brand-700 hover:text-brand-500">
                        {business.name}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {l.phone && (
                      <div className="flex gap-2">
                        <a href={`tel:${l.phone}`} aria-label="חיוג" className="text-ink-400 hover:text-brand-700">
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`https://wa.me/${toWhatsAppNumber(l.phone)}`}
                          target="_blank" rel="noopener noreferrer"
                          aria-label="וואטסאפ"
                          className="text-ink-400 hover:text-[#25D366]"
                        >
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.27-4.36c0-4.55 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.22-8.24 8.22" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {(leads ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-ink-400">אין עדיין פניות.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
