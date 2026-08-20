import type { Metadata, Viewport } from "next";
import { Heebo, Inter, Secular_One } from "next/font/google";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileTabBar } from "@/components/layout/MobileTabBar";
import { AccessibilityToolbar } from "@/components/a11y/AccessibilityToolbar";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";
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
 * Heebo לגוף, Secular One לכותרות — נבחרו במדידה, לא בהתרשמות.
 *
 * המטרה הייתה להתקרב כמה שאפשר ל-bizspace.digital, שרץ על Ploni
 * (גוף) ו-Anomalia UltraBold (כותרות). שתיהן משפחות מסחריות בתשלום
 * ולכן אינן בפרויקט. במקומן נמדדו המטריקות של שתיהן מול כל הגופנים
 * העבריים החופשיים, והושוו שתי תכונות שקובעות איך טקסט *נראה*
 * בגודל נתון: גובה ה-x ורוחב האות העברית הממוצע, שניהם כאחוז מה-em.
 *
 *   Ploni Regular        גובה x 47.5%   רוחב ממוצע 52.0%
 *   Heebo Regular        גובה x 52.8%   רוחב ממוצע 53.2%
 *
 *   Anomalia UltraBold   גובה x 55.0%   רוחב ממוצע 59.1%
 *   Secular One          גובה x 51.5%   רוחב ממוצע 52.7%
 *
 * Heebo הוא הגרוטסק החופשי עם היחס הקרוב ביותר ל-Ploni, והוא גם
 * מה ש-bizspace עצמו מגדיר בשרשרת הפולבאק שלו. Secular One הוא
 * גופן התצוגה העברי החופשי היחיד שנושא את התפקיד של Anomalia —
 * כבד, רחב ומיועד לכותרות ולא לטקסט רץ.
 *
 * הפער שנשאר בגובה ה-x מתוקן בסולם הטיפוגרפי ב-globals.css ולא כאן:
 * הגדלים שם מוכפלים כך שהטקסט יתפוס בדיוק את אותו גובה אופטי כמו
 * ברפרנס. ראו את ההסבר המלא ליד הסולם.
 *
 * ל-Secular One יש משקל אחד בלבד (400) והוא כבד מטבעו. h1/h2
 * מוגדרים ל-400 ב-globals.css; כפיית 800 עליו מייצרת הדגשה
 * סינתטית מרוחה.
 *
 * display: "swap" ולא "optional" — עדיף טקסט בגופן חלופי לרגע מאשר
 * טקסט בלתי נראה. subsets כולל hebrew, אחרת הדפדפן מוריד רק לטינית.
 */
const secular = Secular_One({
  variable: "--font-secular",
  subsets: ["hebrew", "latin"],
  weight: ["400"],
  display: "swap",
});

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
    description: `${brand.name} — מדריך ישראלי לחברות להשכרה: ציוד, רכבים, חללים, כלים וטכנולוגיה בכל הארץ.`,
    keywords: ["השכרת ציוד לאירועים", "השכרת אוהלים", "השכרת רכב", "כלים ומכונות", brand.name],
    authors: [{ name: brand.name }],
    manifest: "/manifest.json",
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brand.name,
    },
    openGraph: {
      type: "website",
      locale: "he_IL",
      siteName: brand.name,
      title,
      description: `מצאו חברות להשכרת ציוד, רכבים, חללים, כלים וטכנולוגיה בכל הארץ.`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: `מדריך ישראלי לחברות להשכרה בכל הארץ.`,
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
    /*
      suppressHydrationWarning על <html> בלבד.
      סקריפט אתחול הנגישות (למטה) חייב לרוץ לפני הצביעה הראשונה, והוא
      כותב data-* ו---font-scale ישירות על התגית. כלומר ה-HTML שהשרת
      שלח שונה במכוון מזה שהלקוח רואה בזמן ההשוואה — וזו בדיוק המטרה.
      הדיכוי לא יורד בעץ: אי-התאמה אמיתית בתוך העמוד עדיין תדווח.
    */
    <html
      lang="he"
      dir="rtl"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${heebo.variable} ${secular.variable} ${inter.variable}`}
      style={brandStyle}
    >
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

        <Header
          user={user}
          brandName={brand.name}
          tagline={brand.tagline}
          logoUrl={brand.logoUrl}
          categories={categories}
          phone={contact.phone}
        />
        {/* הריפוד התחתון הוא גובה סרגל הניווט התחתון (0 בדסקטופ, ראו
            --spacing-tabbar ב-globals.css). בלעדיו השורה האחרונה של
            הפוטר יושבת מתחת לסרגל ולא ניתן להגיע אליה. */}
        <main id="main" className="flex-1" style={{ paddingTop: "var(--spacing-header)" }}>{children}</main>
        <Footer brandName={brand.name} logoUrl={brand.logoUrl} />
        <div aria-hidden="true" style={{ height: "var(--spacing-tabbar)" }} />

        <MobileTabBar isLoggedIn={Boolean(user)} />

        <AccessibilityToolbar />
        <ServiceWorkerRegister />
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
