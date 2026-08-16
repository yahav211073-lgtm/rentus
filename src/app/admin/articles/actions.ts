"use server";

import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { resolveImageField } from "@/lib/uploads";
import { estimateReadingMinutes } from "@/lib/repo/articles";
import { slugify } from "@/lib/utils";

/**
 * ניהול מאמרים.
 *
 * גוף המאמר נשמר כמערך פסקאות ב-jsonb: המנהל כותב טקסט רגיל, שורה
 * ריקה מפרידה בין פסקאות. אין כאן HTML בכוונה — התצוגה מרנדרת את
 * הפסקאות כטקסט, ולכן אין דרך להזריק סקריפט דרך עורך התוכן.
 */
function refresh(slug?: string) {
  revalidatePath("/admin/articles");
  revalidatePath("/admin");
  revalidatePath("/blog");
  revalidatePath("/");
  if (slug) revalidatePath(`/blog/${slug}`);
}

function paragraphsFrom(raw: unknown): string[] {
  return String(raw ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

async function buildPayload(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "כותרת היא שדה חובה." } as const;

  const content = paragraphsFrom(formData.get("content"));
  if (content.length === 0) return { error: "תוכן המאמר ריק." } as const;

  const cover = await resolveImageField(formData, {
    fileKey: "cover", urlKey: "__none__", clearKey: "coverClear", folder: "articles",
  });
  if (!cover.ok) return { error: cover.error } as const;

  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const status = String(formData.get("status") ?? "draft");

  const payload: Record<string, unknown> = {
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    content,
    category_id: categoryId,
    status: ["draft", "published", "archived"].includes(status) ? status : "draft",
    is_featured: formData.get("isFeatured") === "on",
    reading_min: estimateReadingMinutes(content),
    cover_alt: String(formData.get("coverAlt") ?? "").trim() || title,
  };

  // undefined = המשתמש לא נגע בשדה התמונה; לא דורסים את הקיימת.
  if (cover.url !== undefined) payload.cover_url = cover.url;

  // published_at נחתם ברגע הפרסום הראשון בלבד — מאמר שנערך שוב לא
  // אמור לקפוץ לראש הרשימה כאילו נכתב היום.
  if (payload.status === "published") payload.published_at_if_missing = true;

  return { payload } as const;
}

export async function createArticle(formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const built = await buildPayload(formData);
  if ("error" in built) return { ok: false, error: built.error };

  const { published_at_if_missing, ...payload } = built.payload;
  const title = String(payload.title);
  const slug = `${slugify(title).slice(0, 60)}-${Math.random().toString(36).slice(2, 6)}`;

  const { error } = await supabase.from("articles").insert({
    ...payload,
    slug,
    published_at: published_at_if_missing ? new Date().toISOString() : null,
  });

  refresh(slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function updateArticle(id: string, formData: FormData) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const built = await buildPayload(formData);
  if ("error" in built) return { ok: false, error: built.error };

  const { published_at_if_missing, ...payload } = built.payload;

  const { data: existing } = await supabase
    .from("articles").select("slug, published_at").eq("id", id).maybeSingle();

  if (published_at_if_missing && !existing?.published_at) {
    payload.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("articles").update(payload).eq("id", id);

  refresh(existing?.slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function setArticleStatus(id: string, status: "draft" | "published" | "archived") {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data: existing } = await supabase
    .from("articles").select("slug, published_at").eq("id", id).maybeSingle();

  const patch: Record<string, unknown> = { status };
  if (status === "published" && !existing?.published_at) {
    patch.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from("articles").update(patch).eq("id", id);

  refresh(existing?.slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function deleteArticle(id: string) {
  await requireStaff();
  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "אין חיבור למסד הנתונים." };

  const { data: existing } = await supabase
    .from("articles").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("articles").delete().eq("id", id);

  refresh(existing?.slug);
  return error ? { ok: false, error: error.message } : { ok: true };
}
