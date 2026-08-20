"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { STATUSES, type LeadStatus } from "@/lib/lead-status";

/**
 * ניהול פניות.
 *
 * lead_status הוא enum ב-DB (0004). מאמתים מולו כאן ולא סומכים על
 * הערך שהגיע מהלקוח — Server Action היא נקודת קצה לכל דבר, וכל מי
 * שיש לו סשן יכול לקרוא לה עם כל מחרוזת.
 */
  
export async function updateLeadStatus(leadId: string, status: string) {
  await requireStaff();
  if (!STATUSES.includes(status as LeadStatus)) {
    return { ok: false, error: "סטטוס לא מוכר." };
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const patch: Record<string, unknown> = { status };
  // חותמת "יצרנו קשר" נרשמת פעם אחת, בשינוי עצמו — אחרת אי אפשר
  // לדעת בדיעבד כמה זמן לקח להגיב לפנייה.
  if (status === "contacted") patch.contacted_at = new Date().toISOString();

  const { error } = await supabase.from("leads").update(patch).eq("id", leadId);

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateLeadNote(leadId: string, note: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase
    .from("leads")
    .update({ owner_note: note.trim() || null })
    .eq("id", leadId);

  revalidatePath("/admin/leads");
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteLead(leadId: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { error } = await supabase.from("leads").delete().eq("id", leadId);

  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  return error ? { ok: false, error: error.message } : { ok: true };
}
