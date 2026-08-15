import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // העלאות תמונה מנוהלות מגיעות כ־multipart Server Action. המגבלה כוללת
    // גם כותרות multipart, לכן היא מעט גבוהה ממגבלת הקובץ של 5MB בצד השרת.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
