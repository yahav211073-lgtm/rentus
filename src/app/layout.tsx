import type { Metadata, Viewport } from "next";
import { Heebo, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { AccessibilityToolbar } from "@/components/a11y/AccessibilityToolbar";
import { PopupManager } from "@/components/ads/PopupManager";
import { SideBanner } from "@/components/ads/SideBanner";
import { env } from "@/lib/env";
import { getCurrentUser } from "@/lib/auth";
import { getActiveAds } from "@/lib/repo/ads";
import { getBrandSettings } from "@/lib/repo/branding";
import { getCategoriesWithCounts } from "@/lib/repo/categories";
import { getContactDetails } from "@/lib/repo/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import "./globals.css";

/**
 * האם המשתמש בעל עסק, לצורך מיקוד פרסום (audience: "business_owners").
 * לא נשענים על profiles.role — יש טריגר שנועל שינוי role למנהלים
 * בלבד (ראו admin/users/actions.ts), ולכן "בעל עסק" בפועל הוא מי
 * שבבעלותו שורה בטבלת businesses, לא ערך תפקיד שאף אחד לא מעדכן.
 */
async function checkIsBusinessOwner(userId: string | undefined): Promise<boolean> {
  if (!userId) return false;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const { count } = await supabase
    .from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", userId);
  return (count ?? 0) > 0;
}

/**
 * Heebo לעברית, Inter ללטינית.
 *
 * display: "swap" ולא "optional" — עדיף טקסט בגופן חלופי לרגע מאשר
 * טקסט בלתי נראה. subsets כולל hebrew, אחרת הדפדפן מוריד רק לטינית
 * וכל האתר נופל לגופן ברירת המחדל של המערכת.
 */
const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/**
 * generateMetadata ולא אובייקט metadata סטטי — כי שם האתר נקרא
 * מ-settings (brand.identity), לא קשיח בקוד. זה בדיוק מה שהופך שינוי
 * שם באדמין לשינוי אמיתי בתגית ה-title, לא רק במסך הניהול עצמו.
 */
export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandSettings();
  const title = `${brand.name} — ${brand.tagline}`;

  return {
    metadataBase: new URL(env.siteUrl),
    title: { default: title, template: `%s | ${brand.name}` },
    description: `${brand.name} — ${brand.tagline}. מאות עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר.`,
    keywords: ["השכרת ציוד לאירועים", "השכרת אוהלים", "השכרת רכב", "כלים ומכונות", brand.name],
    authors: [{ name: brand.name }],
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName: brand.name,
      title,
      description: `מאות עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר. מצאו בדיוק את מה שאתם צריכים להשכיר.`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `מאות עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר.`,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0C1D40" },
    { media: "(prefers-color-scheme: dark)", color: "#050C1C" },
  ],
  width: "device-width",
  initialScale: 1,
  // לא maximumScale — נעילת זום היא כשל נגישות (WCAG 1.4.4)
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, ads, brand, categories, contact] = await Promise.all([
    getCurrentUser(), getActiveAds(), getBrandSettings(), getCategoriesWithCounts(), getContactDetails(),
  ]);
  const isBusinessOwner = await checkIsBusinessOwner(user?.id);

  // צבעי מותג מ-settings דורסים את הטוקנים בדף עצמו — זו הדרך
  // שבה שינוי צבע באדמין משתקף באתר בלי דיפלוי (ראו globals.css
  // לתיעוד המנגנון: --color-brand-800/600 ו---color-accent-400
  // הם בדיוק הגוונים שרוב הרכיבים משתמשים בהם בפועל).
  const brandStyle = {
    "--color-brand-800": brand.colors.primary,
    "--color-brand-600": brand.colors.secondary,
    "--color-accent-400": brand.colors.accent,
    "--page-bg": brand.colors.background,
  } as React.CSSProperties;

  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`} style={brandStyle}>
      <head>
        {/*
          סקריפט אתחול העדפות הנגישות.

          מוטבע כאן, ב-layout השורשי, ולא בקובץ נפרד — beforeInteractive
          של next/script תקף רק ב-layout השורשי, וקובץ נפרד גורר אזהרה
          מוצדקת מ-ESLint.

          חייב לרוץ לפני הצביעה הראשונה: המשתמש שבחר "ניגודיות גבוהה"
          או "עצירת אנימציות" הוא בדיוק זה שהבזק של העיצוב הרגיל פוגע
          בו, ולעיתים אף מסוכן לו (רגישות לאור).

          עטוף ב-try/catch — אחסון חסום לא מפיל את העמוד.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('index:a11y');if(!raw)return;var s=JSON.parse(raw),r=document.documentElement;if(s.fontScale)r.style.setProperty('--font-scale',String(s.fontScale));if(s.contrast)r.dataset.contrast=s.contrast;if(s.links)r.dataset.links=s.links;if(s.dyslexia)r.dataset.dyslexia=s.dyslexia;if(s.cursor)r.dataset.cursor=s.cursor;r.dataset.motion=s.motion==='off'?'off':'on';}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col">
        {/*
          רשת ביטחון ללא JavaScript.
          אנימציות החשיפה מרונדרות עם opacity:0 מוטבע כבר בשרת, ולכן בלי
          JavaScript כל התוכן מתחת לקיפול היה נשאר בלתי נראה — גם לגולש
          וגם לסורק שלא מריץ סקריפטים. ה-!important נדרש כי מדובר
          בסגנון מוטבע.
        */}
        <noscript>
          <style>{`[style*="opacity:0"],[style*="opacity: 0"]{opacity:1!important;transform:none!important}`}</style>
        </noscript>

        {/* הקישור הראשון בעמוד. מוסתר עד שהוא מקבל פוקוס. */}
        <a href="#main" className="skip-link rounded-sm bg-brand-800 px-5 py-3 text-sm font-bold text-white shadow-lg">
          דילוג לתוכן הראשי
        </a>

        <TopBar phone={contact.phone || "072-3939999"} brandName={brand.name} />
        <Header user={user} brandName={brand.name} logoUrl={brand.logoUrl} categories={categories} />
        <main id="main" className="flex-1">{children}</main>
        <Footer brandName={brand.name} />

        <AccessibilityToolbar />
        {/*
          הפופאפים והבאנרים נטענים בשרת מ-banners/popup_banners לפי
          is_active, כדי שאין הבהוב של תוכן שיווקי לפני שכללי המיקוד
          העדינים (נתיב/מכשיר) שהם client-only מוכרעים.
        */}
        <PopupManager
          popups={ads.popups}
          isLoggedIn={Boolean(user)}
          isBusinessOwner={isBusinessOwner}
        />
        <SideBanner banners={ads.banners} side="start" isLoggedIn={Boolean(user)} isBusinessOwner={isBusinessOwner} />
        <SideBanner banners={ads.banners} side="end" isLoggedIn={Boolean(user)} isBusinessOwner={isBusinessOwner} />
      </body>
    </html>
  );
}
