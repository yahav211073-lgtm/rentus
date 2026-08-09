import type { Metadata, Viewport } from "next";
import { Heebo, Inter } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AccessibilityToolbar } from "@/components/a11y/AccessibilityToolbar";
import { PopupManager } from "@/components/ads/PopupManager";
import { seedPopups } from "@/data/seed";
import { env } from "@/lib/env";
import "./globals.css";

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

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "אינדקס — כל העסקים בישראל במקום אחד",
    template: "%s | אינדקס",
  },
  description:
    "אינדקס העסקים המוביל בישראל. אלפי עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר — הכל במקום אחד.",
  keywords: ["אינדקס עסקים", "בעלי מקצוע", "המלצות", "ביקורות", "ספקים", "ישראל"],
  authors: [{ name: "אינדקס" }],
  openGraph: {
    type: "website",
    locale: "he_IL",
    siteName: "אינדקס",
    title: "אינדקס — כל העסקים בישראל במקום אחד",
    description:
      "אלפי עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר. מצאו את בעל המקצוע הנכון בדקות.",
  },
  twitter: {
    card: "summary_large_image",
    title: "אינדקס — כל העסקים בישראל במקום אחד",
    description: "אלפי עסקים מאומתים, ביקורות אמיתיות והשוואת הצעות מחיר.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B3B75" },
    { media: "(prefers-color-scheme: dark)", color: "#05192F" },
  ],
  width: "device-width",
  initialScale: 1,
  // לא maximumScale — נעילת זום היא כשל נגישות (WCAG 1.4.4)
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`}>
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

        <Header />
        <main id="main" className="flex-1">{children}</main>
        <Footer />

        <AccessibilityToolbar />
        {/*
          הפופאפים והבאנרים מוזנים כאן מתוכן ההדגמה. בגרסה המחוברת
          הם נטענים בשרת מטבלאות popup_banners / banners, כך שאין
          הבהוב של תוכן שיווקי לפני שכללי המיקוד הוכרעו.
        */}
        <PopupManager popups={seedPopups} />
      </body>
    </html>
  );
}
