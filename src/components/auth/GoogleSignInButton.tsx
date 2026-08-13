"use client";

import { useState } from "react";
import { GoogleIcon } from "@/components/ui/icons";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * כניסה/הרשמה עם Google. Google כבר מאמת את כתובת המייל בעצמו —
 * זה עוקף לגמרי את התלות במייל אישור שלנו (ראו השיחה על אמינות
 * שליחת המייל של Supabase).
 */
export function GoogleSignInButton({ next = "/" }: { next?: string }) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    // הדפדפן מפנה מיד ל-Google — אם הבקשה נכשלה עוד לפני זה, מבטלים את הטעינה
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-ink-200 bg-white text-sm font-bold text-ink-700 transition-colors hover:bg-ink-50 disabled:opacity-60"
    >
      <GoogleIcon className="h-4.5 w-4.5" />
      {loading ? "מעביר ל-Google..." : "המשך עם Google"}
    </button>
  );
}
