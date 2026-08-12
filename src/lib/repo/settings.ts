import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface ContactDetails {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

const FALLBACK_CONTACT: ContactDetails = { phone: "", email: "", address: "", whatsapp: "972500000000" };

/** settings.contact.details — ציבורי (is_public=true), אותה טבלה שהאדמין יערוך בעתיד. */
export async function getContactDetails(): Promise<ContactDetails> {
  if (!isSupabaseConfigured) return FALLBACK_CONTACT;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_CONTACT;

  const { data } = await supabase
    .from("settings").select("value").eq("key", "contact.details").maybeSingle();

  if (!data) return FALLBACK_CONTACT;
  const v = data.value as Partial<ContactDetails>;
  return {
    phone: v.phone ?? "",
    email: v.email ?? "",
    address: v.address ?? "",
    whatsapp: v.whatsapp || FALLBACK_CONTACT.whatsapp,
  };
}
