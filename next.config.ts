import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
