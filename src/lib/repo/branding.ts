import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, env } from "@/lib/env";

export interface BrandSettings {
  name: string;
  tagline: string;
  logoUrl: string | null;
  colors: { primary: string; secondary: string; accent: string; background: string };
}

const DEFAULTS: BrandSettings = {
  name: env.siteName,
  tagline: "כל מה שמשכירים, במקום אחד",
  logoUrl: null,
  colors: { primary: "#0A4590", secondary: "#0D63D6", accent: "#FFC107", background: "#EAF5FF" },
};

/**
 * זהות המותג — נקראת ב-layout.tsx (שם ולוגו) ובכל מקום שמציג את שם
 * האתר. זו הדרך שבה שינוי ב-/admin/settings משתקף בפועל באתר: אין
 * "Rentus" קשיח בקוד, יש קריאה לטבלת settings עם נפילה לברירת מחדל.
 */
export async function getBrandSettings(): Promise<BrandSettings> {
  if (!isSupabaseConfigured) return DEFAULTS;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEFAULTS;

  const { data } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["brand.identity", "brand.colors"]);

  const identity = data?.find((r) => r.key === "brand.identity")?.value as Partial<{ name: string; tagline: string; logoUrl: string }> | undefined;
  const colors = data?.find((r) => r.key === "brand.colors")?.value as Partial<BrandSettings["colors"]> | undefined;

  return {
    name: identity?.name || DEFAULTS.name,
    tagline: identity?.tagline || DEFAULTS.tagline,
    logoUrl: identity?.logoUrl || null,
    colors: {
      primary: colors?.primary || DEFAULTS.colors.primary,
      secondary: colors?.secondary || DEFAULTS.colors.secondary,
      accent: colors?.accent || DEFAULTS.colors.accent,
      background: colors?.background || DEFAULTS.colors.background,
    },
  };
}
