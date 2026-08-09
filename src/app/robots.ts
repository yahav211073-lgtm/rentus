import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * robots.txt
 *
 * /search חסום לסריקה: אלפי צירופי מסננים יוצרים אלפי עמודים
 * כמעט-זהים, ומבזבזים את תקציב הסריקה על תוכן דק במקום על עמודי
 * העסקים והקטגוריות שבאמת מביאים תנועה.
 *
 * שימו לב שזו חסימת *סריקה* ולא חסימת *אינדוקס* — לכן יש גם
 * robots: noindex במטא-דאטה של עמוד החיפוש. חסימה ב-robots.txt
 * לבדה לא מונעת מעמוד להופיע בתוצאות אם מקושרים אליו.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/business/dashboard",
          "/api/",
          "/search",           // ראו הערת הכותרת
          "/*?*sort=",         // וריאציות מיון של עמודי קטגוריה
          "/login",
          "/register",
        ],
      },
      {
        // סורקי AI מסחריים — חסומים כברירת מחדל. תוכן שנוצר על ידי
        // בעלי עסקים ומשתמשים אינו שלנו לתרום לאימון מודלים.
        userAgent: ["GPTBot", "CCBot", "ClaudeBot", "Google-Extended", "anthropic-ai"],
        disallow: "/",
      },
    ],
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
