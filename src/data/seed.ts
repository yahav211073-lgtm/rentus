/**
 * תוכן הדגמה.
 *
 * זה מה שהאתר מציג כשאין חיבור ל-Supabase, כדי ש-`npm run dev` ייתן
 * אתר עובד מהרגע הראשון. ברגע ש-NEXT_PUBLIC_SUPABASE_URL מוגדר,
 * שכבת ה-repo עוברת למסד הנתונים והקובץ הזה מפסיק להיות בשימוש.
 *
 * הנתונים כאן בדיוניים בכוונה — אין כאן עסק אמיתי, טלפון אמיתי או
 * ביקורת אמיתית. הטלפונים בטווח 050-0000000 שאינו בשימוש.
 */

import type {
  Area, Article, Business, BusinessCard, Category, City,
  FaqItem, Partner, PopupBanner, StatItem, Tag, Testimonial, Review,
} from "@/types/domain";

/* ============================================================================
   גאוגרפיה
   ============================================================================ */

export const seedAreas: Area[] = [
  { id: "a1", slug: "merkaz", name: "מרכז" },
  { id: "a2", slug: "sharon", name: "השרון" },
  { id: "a3", slug: "shfela", name: "שפלה" },
  { id: "a4", slug: "jerusalem-area", name: "ירושלים והסביבה" },
  { id: "a5", slug: "north", name: "צפון" },
  { id: "a6", slug: "south", name: "דרום" },
];

export const seedCities: City[] = [
  { id: "c1",  slug: "tel-aviv",   name: "תל אביב-יפו", areaId: "a1", areaName: "מרכז",            isPopular: true,  businessCount: 1284 },
  { id: "c2",  slug: "jerusalem",  name: "ירושלים",      areaId: "a4", areaName: "ירושלים והסביבה", isPopular: true,  businessCount: 976 },
  { id: "c3",  slug: "haifa",      name: "חיפה",         areaId: "a5", areaName: "צפון",            isPopular: true,  businessCount: 612 },
  { id: "c4",  slug: "rishon",     name: "ראשון לציון",  areaId: "a1", areaName: "מרכז",            isPopular: true,  businessCount: 508 },
  { id: "c5",  slug: "petah-tikva",name: "פתח תקווה",    areaId: "a1", areaName: "מרכז",            isPopular: true,  businessCount: 471 },
  { id: "c6",  slug: "netanya",    name: "נתניה",        areaId: "a2", areaName: "השרון",           isPopular: true,  businessCount: 433 },
  { id: "c7",  slug: "beer-sheva", name: "באר שבע",      areaId: "a6", areaName: "דרום",            isPopular: true,  businessCount: 389 },
  { id: "c8",  slug: "herzliya",   name: "הרצליה",       areaId: "a2", areaName: "השרון",           isPopular: true,  businessCount: 356 },
  { id: "c9",  slug: "ramat-gan",  name: "רמת גן",       areaId: "a1", areaName: "מרכז",            isPopular: false, businessCount: 341 },
  { id: "c10", slug: "ashdod",     name: "אשדוד",        areaId: "a6", areaName: "דרום",            isPopular: false, businessCount: 298 },
  { id: "c11", slug: "modiin",     name: "מודיעין",      areaId: "a3", areaName: "שפלה",            isPopular: false, businessCount: 214 },
  { id: "c12", slug: "raanana",    name: "רעננה",        areaId: "a2", areaName: "השרון",           isPopular: false, businessCount: 203 },
];

/* ============================================================================
   קטגוריות
   ============================================================================ */

export const seedCategories: Category[] = [
  {
    id: "cat1", slug: "eventim", name: "אירועים והפקות", icon: "PartyPopper",
    accentColor: "#7C3AED", isFeatured: true, businessCount: 842,
    description: "אולמות, גני אירועים, קייטרינג, תקליטנים והפקה מלאה",
    children: [
      { id: "cat1a", slug: "ulamot", name: "אולמות וגני אירועים", icon: "Building2", businessCount: 214 },
      { id: "cat1b", slug: "catering", name: "קייטרינג", icon: "ChefHat", businessCount: 186 },
      { id: "cat1c", slug: "dj", name: "תקליטנים ומוזיקה", icon: "Disc3", businessCount: 173 },
      { id: "cat1d", slug: "tzilum", name: "צילום ווידאו", icon: "Camera", businessCount: 269 },
    ],
  },
  {
    id: "cat2", slug: "shiputzim", name: "שיפוצים ובנייה", icon: "Hammer",
    accentColor: "#EA580C", isFeatured: true, businessCount: 1156,
    description: "קבלני שיפוצים, אינסטלטורים, חשמלאים ובעלי מקצוע",
    children: [
      { id: "cat2a", slug: "kablanim", name: "קבלני שיפוצים", icon: "HardHat", businessCount: 312 },
      { id: "cat2b", slug: "instalator", name: "אינסטלציה", icon: "Wrench", businessCount: 287 },
      { id: "cat2c", slug: "hashmalai", name: "חשמל", icon: "Zap", businessCount: 264 },
      { id: "cat2d", slug: "mizug", name: "מיזוג אוויר", icon: "Wind", businessCount: 293 },
    ],
  },
  {
    id: "cat3", slug: "rehev", name: "רכב ותחבורה", icon: "Car",
    accentColor: "#0891B2", isFeatured: true, businessCount: 694,
    description: "מוסכים, השכרת רכב, גרירה וטיפולים",
    children: [
      { id: "cat3a", slug: "musachim", name: "מוסכים", icon: "Wrench", businessCount: 241 },
      { id: "cat3b", slug: "haskarat-rehev", name: "השכרת רכב", icon: "Key", businessCount: 118 },
      { id: "cat3c", slug: "grira", name: "גרירה וחילוץ", icon: "Truck", businessCount: 97 },
    ],
  },
  {
    id: "cat4", slug: "briut", name: "בריאות ורפואה", icon: "HeartPulse",
    accentColor: "#DC2626", isFeatured: true, businessCount: 923,
    description: "רופאים, מרפאות, פיזיותרפיה ורפואה משלימה",
    children: [
      { id: "cat4a", slug: "rofim", name: "רופאים ומרפאות", icon: "Stethoscope", businessCount: 402 },
      { id: "cat4b", slug: "shinaim", name: "רפואת שיניים", icon: "Smile", businessCount: 231 },
      { id: "cat4c", slug: "fizio", name: "פיזיותרפיה", icon: "Activity", businessCount: 158 },
    ],
  },
  {
    id: "cat5", slug: "yofi", name: "יופי וטיפוח", icon: "Sparkles",
    accentColor: "#DB2777", isFeatured: true, businessCount: 1087,
    description: "מספרות, קוסמטיקה, ציפורניים וספא",
    children: [
      { id: "cat5a", slug: "misparot", name: "מספרות ועיצוב שיער", icon: "Scissors", businessCount: 389 },
      { id: "cat5b", slug: "kosmetika", name: "קוסמטיקה", icon: "Sparkle", businessCount: 297 },
      { id: "cat5c", slug: "tsipornaim", name: "ציפורניים", icon: "Hand", businessCount: 244 },
    ],
  },
  {
    id: "cat6", slug: "mishpati", name: "משפט וכספים", icon: "Scale",
    accentColor: "#0B3B75", isFeatured: true, businessCount: 587,
    description: "עורכי דין, רואי חשבון, יועצי משכנתאות וביטוח",
    children: [
      { id: "cat6a", slug: "orchei-din", name: "עורכי דין", icon: "Gavel", businessCount: 284 },
      { id: "cat6b", slug: "roei-heshbon", name: "רואי חשבון", icon: "Calculator", businessCount: 176 },
      { id: "cat6c", slug: "mashkantaot", name: "משכנתאות", icon: "Home", businessCount: 127 },
    ],
  },
  {
    id: "cat7", slug: "nadlan", name: "נדל״ן ודיור", icon: "Building",
    accentColor: "#059669", isFeatured: true, businessCount: 512,
    description: "תיווך, שמאות, ניהול נכסים והובלות",
    children: [
      { id: "cat7a", slug: "tivuch", name: "תיווך", icon: "MapPin", businessCount: 218 },
      { id: "cat7b", slug: "hovalot", name: "הובלות ואחסנה", icon: "Package", businessCount: 164 },
    ],
  },
  {
    id: "cat8", slug: "limudim", name: "לימודים והדרכה", icon: "GraduationCap",
    accentColor: "#4F46E5", isFeatured: true, businessCount: 438,
    description: "מורים פרטיים, קורסים, גני ילדים וחוגים",
    children: [
      { id: "cat8a", slug: "morim", name: "מורים פרטיים", icon: "BookOpen", businessCount: 196 },
      { id: "cat8b", slug: "kursim", name: "קורסים והכשרות", icon: "Presentation", businessCount: 142 },
    ],
  },
];

export const seedTags: Tag[] = [
  { id: "t1", slug: "open-shabbat",  name: "פתוח בשבת",       icon: "CalendarCheck" },
  { id: "t2", slug: "accessible",    name: "נגיש לנכים",       icon: "Accessibility" },
  { id: "t3", slug: "parking",       name: "חניה במקום",       icon: "CircleParking" },
  { id: "t4", slug: "kosher",        name: "כשר",              icon: "BadgeCheck" },
  { id: "t5", slug: "home-service",  name: "מגיע עד הבית",     icon: "Truck" },
  { id: "t6", slug: "emergency",     name: "שירות 24/7",       icon: "Clock" },
  { id: "t7", slug: "warranty",      name: "אחריות בכתב",      icon: "ShieldCheck" },
  { id: "t8", slug: "free-quote",    name: "הצעת מחיר חינם",   icon: "ReceiptText" },
];

/* ============================================================================
   עסקים
   ============================================================================ */

function card(b: Partial<BusinessCard> & { id: string; slug: string; name: string }): BusinessCard {
  return {
    tagline: null, logoUrl: null, coverUrl: null,
    ratingAvg: 0, reviewCount: 0,
    isVerified: false, isFeatured: false, isSponsored: false,
    tier: "free", priceRange: null, phone: null, whatsapp: null,
    city: null, primaryCategory: null, tags: [],
    ...b,
  } as BusinessCard;
}

export const seedBusinesses: BusinessCard[] = [
  card({
    id: "b1", slug: "beit-hasadot", name: "בית השדות",
    tagline: "גן אירועים בוטיק עם נוף פתוח לשדות",
    ratingAvg: 4.9, reviewCount: 312, isVerified: true, isFeatured: true, isSponsored: true,
    tier: "enterprise", priceRange: 4, phone: "050-0000001", whatsapp: "050-0000001",
    city: { name: "רעננה", slug: "raanana" },
    primaryCategory: { name: "אולמות וגני אירועים", slug: "ulamot" },
    tags: [{ name: "חניה במקום", slug: "parking" }, { name: "כשר", slug: "kosher" }],
  }),
  card({
    id: "b2", slug: "aviv-hashmal", name: "אביב חשמל",
    tagline: "חשמלאי מוסמך, שירות מיידי בכל שעה",
    ratingAvg: 4.8, reviewCount: 487, isVerified: true, isFeatured: true,
    tier: "premium", priceRange: 2, phone: "050-0000002", whatsapp: "050-0000002",
    city: { name: "תל אביב-יפו", slug: "tel-aviv" },
    primaryCategory: { name: "חשמל", slug: "hashmalai" },
    tags: [{ name: "שירות 24/7", slug: "emergency" }, { name: "אחריות בכתב", slug: "warranty" }],
  }),
  card({
    id: "b3", slug: "studio-lior", name: "סטודיו ליאור",
    tagline: "צילום אירועים בגישה תיעודית",
    ratingAvg: 5.0, reviewCount: 198, isVerified: true, isFeatured: true,
    tier: "premium", priceRange: 3, phone: "050-0000003", whatsapp: "050-0000003",
    city: { name: "הרצליה", slug: "herzliya" },
    primaryCategory: { name: "צילום ווידאו", slug: "tzilum" },
    tags: [{ name: "הצעת מחיר חינם", slug: "free-quote" }],
  }),
  card({
    id: "b4", slug: "mosach-hacarmel", name: "מוסך הכרמל",
    tagline: "מוסך מורשה לכל סוגי הרכבים",
    ratingAvg: 4.7, reviewCount: 623, isVerified: true, isSponsored: true,
    tier: "premium", priceRange: 2, phone: "050-0000004",
    city: { name: "חיפה", slug: "haifa" },
    primaryCategory: { name: "מוסכים", slug: "musachim" },
    tags: [{ name: "אחריות בכתב", slug: "warranty" }, { name: "חניה במקום", slug: "parking" }],
  }),
  card({
    id: "b5", slug: "mispara-noga", name: "מספרת נגה",
    tagline: "עיצוב שיער וצבע בסטנדרט בינלאומי",
    ratingAvg: 4.9, reviewCount: 741, isVerified: true, isFeatured: true,
    tier: "premium", priceRange: 3, phone: "050-0000005", whatsapp: "050-0000005",
    city: { name: "תל אביב-יפו", slug: "tel-aviv" },
    primaryCategory: { name: "מספרות ועיצוב שיער", slug: "misparot" },
    tags: [{ name: "נגיש לנכים", slug: "accessible" }],
  }),
  card({
    id: "b6", slug: "levi-shiputzim", name: "לוי שיפוצים",
    tagline: "שיפוץ דירות מקצה לקצה, לוח זמנים מחייב",
    ratingAvg: 4.6, reviewCount: 284, isVerified: true,
    tier: "basic", priceRange: 3, phone: "050-0000006", whatsapp: "050-0000006",
    city: { name: "פתח תקווה", slug: "petah-tikva" },
    primaryCategory: { name: "קבלני שיפוצים", slug: "kablanim" },
    tags: [{ name: "אחריות בכתב", slug: "warranty" }, { name: "הצעת מחיר חינם", slug: "free-quote" }],
  }),
  card({
    id: "b7", slug: "dr-shani-cohen", name: "ד״ר שני כהן",
    tagline: "רפואת שיניים משמרת ואסתטית",
    ratingAvg: 4.9, reviewCount: 356, isVerified: true, isFeatured: true,
    tier: "premium", priceRange: 3, phone: "050-0000007",
    city: { name: "רמת גן", slug: "ramat-gan" },
    primaryCategory: { name: "רפואת שיניים", slug: "shinaim" },
    tags: [{ name: "נגיש לנכים", slug: "accessible" }, { name: "חניה במקום", slug: "parking" }],
  }),
  card({
    id: "b8", slug: "adv-barak-mizrahi", name: "עו״ד ברק מזרחי",
    tagline: "דיני משפחה וליטיגציה אזרחית",
    ratingAvg: 4.8, reviewCount: 167, isVerified: true,
    tier: "basic", priceRange: 4, phone: "050-0000008",
    city: { name: "ירושלים", slug: "jerusalem" },
    primaryCategory: { name: "עורכי דין", slug: "orchei-din" },
    tags: [{ name: "הצעת מחיר חינם", slug: "free-quote" }],
  }),
  card({
    id: "b9", slug: "katering-hagalil", name: "קייטרינג הגליל",
    tagline: "אוכל ביתי לאירועים, כשר למהדרין",
    ratingAvg: 4.7, reviewCount: 429, isVerified: true, isSponsored: true,
    tier: "premium", priceRange: 3, phone: "050-0000009", whatsapp: "050-0000009",
    city: { name: "נתניה", slug: "netanya" },
    primaryCategory: { name: "קייטרינג", slug: "catering" },
    tags: [{ name: "כשר", slug: "kosher" }, { name: "מגיע עד הבית", slug: "home-service" }],
  }),
  card({
    id: "b10", slug: "mizug-express", name: "מיזוג אקספרס",
    tagline: "התקנה ותיקון מזגנים תוך 24 שעות",
    ratingAvg: 4.5, reviewCount: 512, isVerified: true,
    tier: "basic", priceRange: 2, phone: "050-0000010", whatsapp: "050-0000010",
    city: { name: "ראשון לציון", slug: "rishon" },
    primaryCategory: { name: "מיזוג אוויר", slug: "mizug" },
    tags: [{ name: "שירות 24/7", slug: "emergency" }, { name: "מגיע עד הבית", slug: "home-service" }],
  }),
  card({
    id: "b11", slug: "hovalot-yaniv", name: "הובלות יניב",
    tagline: "הובלות דירות ומשרדים עם ביטוח מלא",
    ratingAvg: 4.6, reviewCount: 338, isVerified: true,
    tier: "basic", priceRange: 2, phone: "050-0000011", whatsapp: "050-0000011",
    city: { name: "באר שבע", slug: "beer-sheva" },
    primaryCategory: { name: "הובלות ואחסנה", slug: "hovalot" },
    tags: [{ name: "אחריות בכתב", slug: "warranty" }],
  }),
  card({
    id: "b12", slug: "dj-omer", name: "DJ עומר",
    tagline: "תקליטן לחתונות ואירועי חברה",
    ratingAvg: 4.9, reviewCount: 224, isVerified: true, isFeatured: true,
    tier: "premium", priceRange: 3, phone: "050-0000012", whatsapp: "050-0000012",
    city: { name: "מודיעין", slug: "modiin" },
    primaryCategory: { name: "תקליטנים ומוזיקה", slug: "dj" },
    tags: [{ name: "הצעת מחיר חינם", slug: "free-quote" }],
  }),
];

/* ============================================================================
   ביקורות
   ============================================================================ */

export const seedReviews: Review[] = [
  {
    id: "r1", businessId: "b1", authorName: "מיכל א׳", rating: 5,
    ratingQuality: 5, ratingService: 5, ratingValue: 4,
    title: "האירוע יצא בדיוק כמו שדמיינו",
    body: "התחלנו לתכנן חצי שנה מראש והצוות ליווה אותנו בכל שלב. ביום עצמו הכל עבד בלי תקלה אחת, וגם כשהתחיל גשם היה מענה מוכן תוך רבע שעה.",
    ownerReply: "מיכל, תודה רבה! שמחנו להיות חלק מהיום שלכם.",
    ownerRepliedAt: "2026-05-02T09:00:00Z",
    helpfulCount: 24, createdAt: "2026-04-28T18:30:00Z",
  },
  {
    id: "r2", businessId: "b1", authorName: "דניאל ר׳", rating: 5,
    title: "מקום יפהפה", body: "הנוף בשקיעה עשה חצי מהעבודה. שירות מצוין.",
    helpfulCount: 11, createdAt: "2026-03-14T12:00:00Z",
  },
  {
    id: "r3", businessId: "b1", authorName: "יעל ב׳", rating: 4,
    title: "טוב מאוד, עם הערה אחת",
    body: "הכל היה ברמה גבוהה. החניה קצת רחוקה מהכניסה וזה הפריע לאורחים המבוגרים.",
    helpfulCount: 7, createdAt: "2026-02-20T20:15:00Z",
  },
];

/* ============================================================================
   תוכן שיווקי
   ============================================================================ */

export const seedStats: StatItem[] = [
  { id: "s1", label: "עסקים מאומתים", value: 14200, suffix: "+", icon: "Store" },
  { id: "s2", label: "ביקורות אמיתיות", value: 96500, suffix: "+", icon: "MessageSquareQuote" },
  { id: "s3", label: "פניות בחודש", value: 38000, suffix: "+", icon: "PhoneCall" },
  { id: "s4", label: "ערים ברחבי הארץ", value: 340, suffix: "", icon: "MapPin" },
];

export const seedTestimonials: Testimonial[] = [
  {
    id: "tm1", authorName: "רונית לוי", authorRole: "בעלת סטודיו לעיצוב",
    quote: "תוך שבועיים מהרישום קיבלתי יותר פניות מאשר בשנה שלמה של קידום ממומן. הפרופיל פשוט עובד.",
    rating: 5,
  },
  {
    id: "tm2", authorName: "אמיר ש׳", authorRole: "לקוח",
    quote: "חיפשתי חשמלאי בשבע בערב. תוך שתי דקות היו לי שלוש הצעות מחיר, עם ביקורות אמיתיות שאפשר לסמוך עליהן.",
    rating: 5,
  },
  {
    id: "tm3", authorName: "טל ברקוביץ׳", authorRole: "מנהל רשת מוסכים",
    quote: "מה ששכנע אותנו זה לוח הבקרה. אנחנו רואים בדיוק כמה פניות הגיעו, מאיזה עמוד, ומה קרה איתן.",
    rating: 5,
  },
  {
    id: "tm4", authorName: "נועה גרין", authorRole: "מפיקת אירועים",
    quote: "השוואה בין ספקים באותו מסך, בלי לפתוח עשרים טאבים. חסך לי ימי עבודה.",
    rating: 5,
  },
];

export const seedFaq: FaqItem[] = [
  {
    id: "f1",
    question: "האם הרישום לאינדקס כרוך בתשלום?",
    answer: "פרופיל בסיסי הוא ללא עלות וכולל את פרטי העסק, שעות פעילות, גלריה של עד חמש תמונות וקבלת פניות. מסלולים בתשלום מוסיפים בליטות בתוצאות החיפוש, גלריה מורחבת, ניתוח פניות ותג עסק מאומת.",
  },
  {
    id: "f2",
    question: "איך אתם מוודאים שהביקורות אמיתיות?",
    answer: "כל ביקורת עוברת בדיקה לפני פרסום. אנחנו מזהים דפוסי הצפה ממקור יחיד, חוסמים ביקורות מחשבונות חדשים ללא היסטוריה, ומאפשרים לבעל העסק להשיב בפומבי. ביקורת שנמחקת — נמחקת עם סיבה מתועדת.",
  },
  {
    id: "f3",
    question: "כמה זמן לוקח עד שהעסק שלי מופיע?",
    answer: "אחרי מילוי הפרטים העסק עובר אישור ידני, בדרך כלל תוך יום עסקים אחד. אישור ידני הוא מה שמונע מהאינדקס להתמלא ברשומות ריקות.",
  },
  {
    id: "f4",
    question: "האם אני יכול לערוך את הפרופיל אחרי הפרסום?",
    answer: "כן, בכל רגע ומלוח הבקרה של העסק. שינויים בפרטי קשר ובשעות פעילות נכנסים לתוקף מיד. שינוי שם או קטגוריה ראשית עובר אישור קצר.",
  },
  {
    id: "f5",
    question: "מה קורה עם הפניות שמגיעות אליי?",
    answer: "כל פנייה נשמרת בלוח הבקרה עם מקור ההגעה, ונשלחת אליכם במקביל למייל ובוואטסאפ. אפשר לסמן סטטוס לכל פנייה ולראות בסוף החודש כמה מהן נסגרו.",
  },
  {
    id: "f6",
    question: "האם האתר נגיש?",
    answer: "האתר עומד בתקן WCAG 2.2 ברמה AA. יש סרגל נגישות בכל עמוד המאפשר הגדלת טקסט, מצבי ניגודיות, הדגשת קישורים, עצירת אנימציות ומדריך קריאה. ניווט מלא במקלדת נתמך בכל המסכים.",
  },
];

export const seedArticles: Article[] = [
  {
    id: "ar1", slug: "how-to-choose-event-venue",
    title: "איך בוחרים אולם אירועים בלי להתחרט אחר כך",
    excerpt: "שבע שאלות שכדאי לשאול לפני שחותמים, וסעיף אחד בחוזה שרוב הזוגות לא קוראים.",
    categoryName: "אירועים", authorName: "מערכת האינדקס", readingMin: 7,
    publishedAt: "2026-06-18T08:00:00Z",
  },
  {
    id: "ar2", slug: "renovation-budget-guide",
    title: "מדריך תקציב שיפוץ: כמה זה באמת עולה ב-2026",
    excerpt: "פירוק עלויות אמיתי לפי חדר, כולל ההוצאות שתמיד מפתיעות באמצע הדרך.",
    categoryName: "שיפוצים", authorName: "מערכת האינדקס", readingMin: 11,
    publishedAt: "2026-06-04T08:00:00Z",
  },
  {
    id: "ar3", slug: "reading-reviews-right",
    title: "לקרוא ביקורות נכון: מה מסתתר מאחורי חמישה כוכבים",
    excerpt: "למה עסק עם 4.6 ומאתיים ביקורות עדיף כמעט תמיד על עסק עם 5.0 ושתים עשרה.",
    categoryName: "מדריכים", authorName: "מערכת האינדקס", readingMin: 5,
    publishedAt: "2026-05-22T08:00:00Z",
  },
];

export const seedPartners: Partner[] = [
  { id: "p1", name: "לשכת המסחר", logoUrl: "" },
  { id: "p2", name: "איגוד הקבלנים", logoUrl: "" },
  { id: "p3", name: "התאחדות המלונות", logoUrl: "" },
  { id: "p4", name: "עמותת נגישות ישראל", logoUrl: "" },
  { id: "p5", name: "איגוד המפיקים", logoUrl: "" },
  { id: "p6", name: "לשכת רואי החשבון", logoUrl: "" },
];

export const seedTrendingSearches = [
  "אולם אירועים בשרון",
  "חשמלאי 24 שעות",
  "מוסך מורשה",
  "קייטרינג כשר",
  "צלם חתונות",
  "אינסטלטור דחוף",
];

export const seedPopups: PopupBanner[] = [
  {
    id: "pop1",
    title: "הרשמת עסקים — מבצע השקה",
    kind: "promotion",
    layout: "corner",
    heading: "שלושה חודשים במסלול פרימיום, בלי עלות",
    body: "רשמו את העסק עד סוף החודש וקבלו בליטות בתוצאות החיפוש, גלריה מורחבת וניתוח פניות מלא.",
    assetUrl: null,
    alt: "מבצע השקה להרשמת עסקים",
    ctaLabel: "לרישום העסק",
    ctaHref: "/business/register",
    secondaryLabel: "לא עכשיו",
    triggerType: "delay",
    triggerDelaySec: 12,
    triggerScrollPct: 50,
    targeting: { audience: "guests", excludePaths: ["/admin", "/business"] },
    maxShowsPerUser: 2,
    cooldownHours: 24,
    dismissCooldownHours: 168,
    priority: 10,
    isActive: true,
  },
];

/** עסק מלא אחד, לעמוד הפרופיל בזמן פיתוח. */
export const seedBusinessDetail: Business = {
  id: "b1",
  slug: "beit-hasadot",
  name: "בית השדות",
  tagline: "גן אירועים בוטיק עם נוף פתוח לשדות",
  description:
    "בית השדות הוא גן אירועים בוטיק בשולי רעננה, עם רחבה פתוחה לשדות ואולם חורף מקורה ל-400 מוזמנים. " +
    "המקום מתמחה באירועים אינטימיים עד בינוניים, עם צוות הפקה קבוע שמלווה כל אירוע מהפגישה הראשונה ועד הפירוק. " +
    "המטבח כשר למהדרין ופועל במקום, כך שהאוכל יוצא חם ולא עובר הובלה.",
  status: "published",
  tier: "enterprise",
  isVerified: true,
  isFeatured: true,
  isSponsored: true,
  city: seedCities.find((c) => c.slug === "raanana") ?? null,
  area: seedAreas.find((a) => a.slug === "sharon") ?? null,
  address: "דרך השדות 12, רעננה",
  latitude: 32.1848,
  longitude: 34.8713,
  phone: "050-0000001",
  whatsapp: "050-0000001",
  email: "info@example.com",
  website: "https://example.com",
  social: { facebook: "#", instagram: "#" },
  logoUrl: null,
  coverUrl: null,
  gallery: [],
  videoUrl: null,
  categories: [],
  primaryCategory: { id: "cat1a", slug: "ulamot", name: "אולמות וגני אירועים" },
  tags: [
    { id: "t3", slug: "parking", name: "חניה במקום" },
    { id: "t4", slug: "kosher", name: "כשר" },
    { id: "t2", slug: "accessible", name: "נגיש לנכים" },
  ],
  priceRange: 4,
  ratingAvg: 4.9,
  reviewCount: 312,
  viewCount: 18420,
  hours: [
    { dayOfWeek: 0, opensAt: "09:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 1, opensAt: "09:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 2, opensAt: "09:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 3, opensAt: "09:00", closesAt: "22:00", isClosed: false },
    { dayOfWeek: 4, opensAt: "09:00", closesAt: "15:00", isClosed: false },
    { dayOfWeek: 5, opensAt: null, closesAt: null, isClosed: true, note: "סגור בשבת" },
    { dayOfWeek: 6, opensAt: "10:00", closesAt: "23:00", isClosed: false },
  ],
  services: [
    { id: "sv1", name: "חתונה — חבילה מלאה", description: "אולם, קייטרינג, עיצוב בסיסי והפקה", price: 320, priceUnit: "למנה, החל מ-", isFeatured: true },
    { id: "sv2", name: "בר/בת מצווה", description: "כולל רחבה, תפריט ילדים והגברה", price: 240, priceUnit: "למנה, החל מ-" },
    { id: "sv3", name: "אירוע חברה", description: "כנסים וימי גיבוש עד 400 איש", price: null, priceUnit: "לפי הצעת מחיר" },
    { id: "sv4", name: "ברית / אירוע בוקר", description: "עד 150 איש, אולם החורף", price: 145, priceUnit: "למנה, החל מ-" },
  ],
  seoTitle: null,
  seoDescription: null,
  publishedAt: "2025-11-02T10:00:00Z",
  createdAt: "2025-10-28T10:00:00Z",
};
