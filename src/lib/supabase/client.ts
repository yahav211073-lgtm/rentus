"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * לקוח Supabase לדפדפן.
 *
 * הלקוח נוצר פעם אחת ונשמר במודול. createBrowserClient מחזיק
 * מאזין לרענון טוקן, ויצירה חוזרת שלו בכל רינדור יוצרת מאזינים
 * כפולים ורענוני סשן מיותרים.
 */
let cached: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured) return null;
  if (!cached) {
    cached = createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
  }
  return cached;
}
