import type { NextConfig } from "next";

/**
 * כותרות אבטחה.
 *
 * מה שנאכף כאן הוא מה שאפשר לאכוף בלי לשבור את האתר:
 *
 * · frame-ancestors — מונע הטמעה של האתר ב-iframe זר (clickjacking).
 *   מחליף את X-Frame-Options, שנשאר גם הוא לדפדפנים ישנים.
 * · base-uri / form-action — חוסמים הזרקת <base> והפניית טפסים
 *   לדומיין זר, שתי דרכים קלאסיות לגנוב שליחת טופס.
 * · object-src none — אין באתר תוכן Flash/פלאגין, ואין סיבה להתיר.
 *
 * מה שלא נאכף, במודע: script-src מתיר 'unsafe-inline'. סקריפט
 * אתחול הנגישות ב-layout.tsx חייב לרוץ לפני הצביעה הראשונה, והידוק
 * שלו דורש nonce שנוצר ב-proxy ומועבר לכל תגית סקריפט. זה שינוי
 * אמיתי ולא שורת קונפיג, ולכן הוא מסומן כאן ולא מוסתר.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },

  experimental: {
    // העלאות תמונה מנוהלות מגיעות כ־multipart Server Action. המגבלה כוללת
    // גם כותרות multipart, לכן היא מעט גבוהה ממגבלת הקובץ של 5MB בצד השרת.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    // כל תמונות התוכן המנוהל (הירו, לוגו, כיסוי עסק, קטגוריות) מגיעות
    // מ-Supabase Storage. תבנית רחבה ל-*.supabase.co ולא לדומיין ספציפי,
    // כדי שהקונפיגורציה תישאר תקפה גם אם פרויקט ה-Supabase משתנה בין סביבות.
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
    ],
  },
};

export default nextConfig;
