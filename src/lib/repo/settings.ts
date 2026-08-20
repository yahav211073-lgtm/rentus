import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export interface ContactDetails {
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
}

const FALLBACK_CONTACT: ContactDetails = { phone: "", email: "", address: "", whatsapp: "972500000000" };

/** settings.contact.details — ציבורי (is_public=true), אותה טבלה שהאדמין יערוך בעתיד. */
export async function getContactDetails(): Promise<ContactDetails> {
  if (!isSupabaseConfigured) return FALLBACK_CONTACT;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_CONTACT;

  const { data } = await supabase
    .from("settings").select("value").eq("key", "contact.details").maybeSingle();

  if (!data) return FALLBACK_CONTACT;
  const v = data.value as Partial<ContactDetails>;
  return {
    phone: v.phone?.trim() ?? "",
    email: v.email?.trim() ?? "",
    address: v.address?.trim() ?? "",
    // רווח נגרר במספר וואטסאפ שובר את קישור wa.me בשקט
    whatsapp: v.whatsapp?.trim() || FALLBACK_CONTACT.whatsapp,
  };
}

export interface AboutContent {
  intro: string;
  points: { title: string; body: string }[];
}

const FALLBACK_ABOUT: AboutContent = {
  intro: "הוא המקום שבו מוצאים כל מה שצריך להשכיר — מציוד לאירועים ועד כלי עבודה ורכב — דרך עסקים מאומתים בכל הארץ. במקום לחפש בעשרים קבוצות ואתרים שונים, הכל נמצא כאן, במקום אחד.",
  points: [
    { title: "עסקים מאומתים", body: "כל עסק חדש עובר בדיקה ואישור ידני לפני שהוא מתפרסם — לא כל מי שנרשם עולה אוטומטית." },
    { title: "ביקורות אמיתיות בלבד", body: "ביקורות עוברות מודרציה לפני פרסום, כדי שהדירוג שאתם רואים יהיה אמין." },
    { title: "פריסה ארצית", body: "עסקים מכל אזורי הארץ — צפון, מרכז, דרום — במקום אחד." },
    { title: "השוואה הוגנת", body: "עסקים מומלצים נבחרים לפי דירוג וביקורות, לא לפי מי ששילם הכי הרבה." },
  ],
};

/** settings.about.content — טקסט עמוד "אודות", ניתן לעריכה מ-/admin/settings. */
export async function getAboutContent(): Promise<AboutContent> {
  if (!isSupabaseConfigured) return FALLBACK_ABOUT;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return FALLBACK_ABOUT;

  const { data } = await supabase
    .from("settings").select("value").eq("key", "about.content").maybeSingle();

  if (!data) return FALLBACK_ABOUT;
  const v = data.value as Partial<AboutContent>;
  const points = Array.isArray(v.points) && v.points.length === 4 ? v.points : FALLBACK_ABOUT.points;
  return {
    intro: v.intro?.trim() || FALLBACK_ABOUT.intro,
    points: points.map((p, i) => ({
      title: p?.title?.trim() || FALLBACK_ABOUT.points[i].title,
      body: p?.body?.trim() || FALLBACK_ABOUT.points[i].body,
    })),
  };
}

/**
 * קישורי הרשתות החברתיות של האתר.
 *
 * הפוטר מציג רק את מה שחוזר מכאן ובאמת מלא — קודם היו שם שלושה
 * קישורים קבועים עם href="#" שנראו פעילים ולא הובילו לשום מקום.
 */
export async function getSocialLinks(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured) return {};

  const supabase = await createSupabaseServerClient();
  if (!supabase) return {};

  const { data } = await supabase
    .from("settings").select("value").eq("key", "social.links").maybeSingle();

  const value = (data?.value ?? {}) as Record<string, string>;
  return Object.fromEntries(
    Object.entries(value)
      .map(([k, v]) => [k, String(v ?? "").trim()])
      .filter(([, v]) => v.length > 0),
  );
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

/**
 * תוכן ברירת המחדל של עמוד השאלות והתשובות.
 *
 * הרשימה אינה רק מצב פיתוח: גם אם החיבור למסד נכשל או שטרם הורצה
 * מיגרציית התוכן, דף ציבורי חשוב לא אמור להציג הודעת "עדיין אין".
 * אותם מזהים מופיעים במיגרציה 0020, כך שאין כפילות כשהמסד זמין.
 */
export const DEFAULT_GLOBAL_FAQ: FaqItem[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    question: "מה זה Rentus ולמי השירות מתאים?",
    answer: "Rentus הוא מדריך ישראלי לחברות ועסקים שמציעים ציוד ושירותים להשכרה. האתר מתאים לכל מי שמחפש להשכיר ציוד לאירועים, כלי עבודה, ציוד מקצועי ופתרונות נוספים ברחבי הארץ.",
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    question: "האם החיפוש והשימוש באתר עולים כסף?",
    answer: "לא. החיפוש, הצפייה בפרופילי החברות והפנייה אליהן פתוחים למשתמשים ללא תשלום וללא התחייבות.",
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    question: "איך מוצאים חברה שמתאימה למה שאני צריך?",
    answer: "אפשר לחפש לפי מילת חיפוש, קטגוריה או עיר. בכל כרטיס חברה מוצגים פרטים כמו תחום הפעילות, אזור השירות, דירוג ודרכי יצירת קשר, כדי שתוכלו להשוות לפני הפנייה.",
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    question: "איך יוצרים קשר עם חברה שמצאתי באתר?",
    answer: "הפנייה נעשית ישירות לחברה באמצעות הטלפון, הוואטסאפ או אתר החברה, בהתאם לפרטים שמופיעים בכרטיס שלה. Rentus אינו מתווך בשיחה ואינו מסתיר את פרטי הקשר.",
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    question: "האם צריך לפתוח חשבון כדי לפנות לעסק?",
    answer: "לא. אפשר לחפש חברות ולפנות אליהן ישירות גם ללא הרשמה. חשבון נדרש לבעלי חברות שרוצים לרשום עסק ולנהל את הפרופיל שלו.",
  },
  {
    id: "20000000-0000-4000-8000-000000000006",
    question: "מי קובע את המחיר והזמינות של ההשכרה?",
    answer: "כל חברה קובעת בעצמה את המחירים, המלאי, תנאי ההשכרה והזמינות. מומלץ לפנות לכמה חברות, לבקש הצעה מפורטת ולוודא את כל התנאים ישירות מול הספק לפני תשלום.",
  },
  {
    id: "20000000-0000-4000-8000-000000000007",
    question: "האם Rentus גובה עמלה על עסקה?",
    answer: "לא. העסקה, ההסכם והתשלום מתבצעים ישירות בין הלקוח לחברה. Rentus אינו צד לעסקה ואינו גובה מהמשתמש עמלה על ההשכרה.",
  },
  {
    id: "20000000-0000-4000-8000-000000000008",
    question: "מה המשמעות של חברה מאומתת?",
    answer: "חברה מאומתת היא חברה שפרטיה נבדקו ידנית לפני הפרסום. הסימון עוזר לזהות פרופילים שעברו בדיקה, אך עדיין חשוב לוודא מול החברה את המחיר, הביטוח, הזמינות ותנאי ההשכרה הרלוונטיים לעסקה שלכם.",
  },
  {
    id: "20000000-0000-4000-8000-000000000009",
    question: "איך אתם שומרים על אמינות הביקורות?",
    answer: "כל ביקורת חדשה עוברת בדיקה לפני הפרסום. ביקורות מזויפות, פוגעניות או לא רלוונטיות אינן מאושרות, ובעל העסק יכול להגיב לביקורת אך אינו יכול לערוך או למחוק אותה בעצמו.",
  },
  {
    id: "20000000-0000-4000-8000-000000000010",
    question: "מצאתי מידע שגוי או ביקורת בעייתית. מה עושים?",
    answer: "אפשר לפנות אלינו דרך עמוד צור קשר ולצרף את שם החברה והפרט שדורש בדיקה. הצוות יבדוק את הדיווח ויעדכן או יסיר תוכן שמפר את מדיניות האתר.",
  },
  {
    id: "20000000-0000-4000-8000-000000000011",
    question: "איך מוסיפים חברה ל-Rentus?",
    answer: "יוצרים חשבון, עוברים לעמוד רישום חברה וממלאים את פרטי העסק. אפשר גם לפנות אלינו בוואטסאפ ולבקש רישום ידני. הבקשה נשמרת כממתינה ועוברת בדיקה לפני הפרסום.",
  },
  {
    id: "20000000-0000-4000-8000-000000000012",
    question: "כמה עולה לפרסם חברה וכמה זמן לוקח האישור?",
    answer: "פרופיל בסיסי הוא ללא עלות ומאפשר להציג את החברה ולקבל פניות. בקשות נבדקות בדרך כלל בתוך יום עסקים אחד. מסלול פרימיום בתשלום מוסיף נראות במקומות בולטים באתר, והפרטים המלאים זמינים בעמוד מסלולי הפרסום.",
  },
];

/**
 * שאלות ותשובות כלליות.
 *
 * scope='global' בלבד — הטבלה תומכת גם ב-scope של קטגוריה או עסק,
 * ושליפה בלי הסינון הזה הייתה מציגה בעמוד הכללי שאלות ששייכות
 * לעסק מסוים.
 */
export async function getGlobalFaq(): Promise<FaqItem[]> {
  if (!isSupabaseConfigured) return DEFAULT_GLOBAL_FAQ;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return DEFAULT_GLOBAL_FAQ;

  const { data, error } = await supabase
    .from("faq")
    .select("id, question, answer")
    .eq("scope", "global")
    .eq("is_active", true)
    .order("sort_order");

  if (error || !data?.length) return DEFAULT_GLOBAL_FAQ;
  return data.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));
}
