"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { hasUpload, uploadPublicImage } from "@/lib/uploads";

function refreshAdViews() {
  revalidatePath("/admin/ads");
  revalidatePath("/", "layout");
}

export async function createBanner(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  let assetUrl = String(formData.get("assetUrl") ?? "") || null;
  if (hasUpload(formData.get("image"))) {
    const upload = await uploadPublicImage(formData.get("image"), "banners");
    if (!upload.ok) return upload;
    assetUrl = upload.url;
  }

  const { error } = await supabase!.from("banners").insert({
    title: String(formData.get("title") ?? ""),
    placement_key: String(formData.get("placementKey") ?? ""),
    asset_url: assetUrl,
    alt: String(formData.get("alt") ?? "") || String(formData.get("title") ?? ""),
    href: String(formData.get("href") ?? "") || null,
    is_active: formData.get("isActive") === "on",
  });

  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function toggleBannerActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("banners").update({ is_active: isActive }).eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteBanner(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("banners").delete().eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function createPopup(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  let assetUrl = String(formData.get("assetUrl") ?? "") || null;
  if (hasUpload(formData.get("image"))) {
    const upload = await uploadPublicImage(formData.get("image"), "popups");
    if (!upload.ok) return upload;
    assetUrl = upload.url;
  }

  const { error } = await supabase!.from("popup_banners").insert({
    title: String(formData.get("title") ?? ""),
    heading: String(formData.get("heading") ?? "") || null,
    body: String(formData.get("body") ?? "") || null,
    asset_url: assetUrl,
    alt: String(formData.get("title") ?? ""),
    cta_label: String(formData.get("ctaLabel") ?? "") || null,
    cta_href: String(formData.get("ctaHref") ?? "") || null,
    trigger_type: String(formData.get("triggerType") ?? "delay"),
    trigger_delay_sec: Number(formData.get("triggerDelaySec") ?? 5),
    is_active: formData.get("isActive") === "on",
  });

  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function togglePopupActive(id: string, isActive: boolean) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("popup_banners").update({ is_active: isActive }).eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deletePopup(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase!.from("popup_banners").delete().eq("id", id);
  refreshAdViews();
  return error ? { ok: false, error: error.message } : { ok: true };
}
