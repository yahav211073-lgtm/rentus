/**
 * טיפוסי הדומיין של האפליקציה.
 *
 * אלה טיפוסי התצוגה — מה שרכיבי React מקבלים. הם דומים לסכימת
 * מסד הנתונים אבל לא זהים לה: שדות מקושרים כבר מורכבים (city כאובייקט
 * ולא city_id), ושדות פנימיים (search_vector, ip_hash) לא נכללים.
 *
 * ההפרדה הזו היא מה שמאפשר להחליף את מקור הנתונים בלי לגעת ברכיבים.
 */

export type UserRole = "admin" | "moderator" | "editor" | "business_owner" | "user";

export type BusinessStatus =
  | "draft" | "pending" | "published" | "rejected" | "suspended" | "archived";

export type BusinessTier = "free" | "basic" | "premium" | "enterprise";

export interface Area {
  id: string;
  slug: string;
  name: string;
}

export interface City {
  id: string;
  slug: string;
  name: string;
  areaId?: string | null;
  areaName?: string | null;
  isPopular?: boolean;
  businessCount?: number;
}

export interface Category {
  id: string;
  parentId?: string | null;
  slug: string;
  name: string;
  description?: string | null;
  /** שם אייקון מ-lucide-react, לא נתיב לקובץ */
  icon?: string | null;
  imageUrl?: string | null;
  accentColor?: string | null;
  isFeatured?: boolean;
  businessCount?: number;
  children?: Category[];
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  icon?: string | null;
}

export interface MediaItem {
  id: string;
  url: string;
  alt: string;
  kind?: "image" | "video" | "lottie";
  width?: number;
  height?: number;
  blurHash?: string | null;
  caption?: string | null;
}

export interface BusinessHours {
  dayOfWeek: number;          // 0 = ראשון
  opensAt?: string | null;    // "09:00"
  closesAt?: string | null;
  isClosed: boolean;
  note?: string | null;
}

export interface BusinessService {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  priceUnit?: string | null;
  isFeatured?: boolean;
}

export interface Review {
  id: string;
  businessId: string;
  authorName: string;
  authorAvatarUrl?: string | null;
  rating: number;
  ratingQuality?: number | null;
  ratingService?: number | null;
  ratingValue?: number | null;
  title?: string | null;
  body?: string | null;
  ownerReply?: string | null;
  ownerRepliedAt?: string | null;
  helpfulCount: number;
  createdAt: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  /** שנת הקמה. מזינה את "שנות ניסיון" — מחושב, לא מוזן ידנית. */
  foundedYear?: number | null;

  status: BusinessStatus;
  tier: BusinessTier;
  isVerified: boolean;
  isFeatured: boolean;
  isSponsored: boolean;

  city?: City | null;
  area?: Area | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  /** האם העסק מגיע ללקוח (שירות נייד), ובאיזה רדיוס בק"מ */
  isMobileService?: boolean;
  serviceRadiusKm?: number | null;
  addressNote?: string | null;

  phone?: string | null;
  phoneSecondary?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;
  social?: Record<string, string>;

  logoUrl?: string | null;
  coverUrl?: string | null;
  gallery?: MediaItem[];
  videoUrl?: string | null;

  categories: Category[];
  primaryCategory?: Category | null;
  tags?: Tag[];

  priceRange?: 1 | 2 | 3 | 4 | null;
  priceNote?: string | null;
  acceptsOnlineBooking?: boolean;
  ratingAvg: number;
  reviewCount: number;
  viewCount?: number;

  hours?: BusinessHours[];
  services?: BusinessService[];

  seoTitle?: string | null;
  seoDescription?: string | null;
  seoNoindex?: boolean;

  publishedAt?: string | null;
  createdAt: string;
}

/** גרסה מצומצמת לכרטיסים ברשימות — פחות נתונים על החוט. */
export type BusinessCard = Pick<
  Business,
  | "id" | "slug" | "name" | "tagline" | "logoUrl" | "coverUrl"
  | "ratingAvg" | "reviewCount" | "isVerified" | "isFeatured" | "isSponsored"
  | "tier" | "priceRange" | "phone" | "whatsapp" | "website" | "social"
> & {
  city?: Pick<City, "name" | "slug"> | null;
  primaryCategory?: Pick<Category, "name" | "slug"> | null;
  tags?: Pick<Tag, "name" | "slug">[];
};

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  /** גוף הכתבה — פסקאות טקסט מלא, מוצג בעמוד /blog/[slug] */
  content?: string[];
  coverUrl?: string | null;
  coverAlt?: string | null;
  categoryName?: string | null;
  authorName?: string | null;
  readingMin?: number | null;
  publishedAt?: string | null;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorRole?: string | null;
  authorAvatarUrl?: string | null;
  quote: string;
  rating?: number | null;
}

export interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  href?: string | null;
}

export interface StatItem {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  icon?: string;
}

/* --- פרסום ------------------------------------------------------------- */

export type CreativeKind = "image" | "gif" | "video" | "lottie" | "html";

export interface AdTargeting {
  categories?: string[];
  cities?: string[];
  devices?: ("desktop" | "tablet" | "mobile")[];
  audience?: "all" | "guests" | "logged_in" | "business_owners";
  paths?: string[];
  excludePaths?: string[];
}

export interface Banner {
  id: string;
  placementKey: string;
  title: string;
  kind: CreativeKind;
  assetUrl?: string | null;
  assetUrlMobile?: string | null;
  html?: string | null;
  alt: string;
  href?: string | null;
  targeting: AdTargeting;
  startsAt?: string | null;
  endsAt?: string | null;
  weight: number;
  priority: number;
  isActive: boolean;
}

export type PopupLayout = "modal" | "fullscreen" | "slide" | "bottom_bar" | "corner";
export type PopupTrigger =
  | "immediate" | "delay" | "scroll" | "exit_intent" | "first_visit" | "returning_visitor";

export interface PopupBanner {
  id: string;
  title: string;
  kind: "promotion" | "announcement" | "coupon" | "newsletter" | "business_promo" | "holiday";
  layout: PopupLayout;
  heading?: string | null;
  body?: string | null;
  assetUrl?: string | null;
  alt?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  secondaryLabel?: string | null;
  triggerType: PopupTrigger;
  triggerDelaySec: number;
  triggerScrollPct: number;
  targeting: AdTargeting;
  startsAt?: string | null;
  endsAt?: string | null;
  maxShowsPerUser: number;
  cooldownHours: number;
  dismissCooldownHours: number;
  priority: number;
  isActive: boolean;
}

/* --- חיפוש -------------------------------------------------------------- */

export type SortOption =
  | "relevance" | "rating" | "reviews" | "newest" | "name" | "distance";

export interface SearchFilters {
  q?: string;
  category?: string;
  city?: string;
  area?: string;
  tags?: string[];
  minRating?: number;
  priceRange?: number[];
  openNow?: boolean;
  verifiedOnly?: boolean;
  sort?: SortOption;
  page?: number;
}

export interface SearchResult {
  items: BusinessCard[];
  total: number;
  page: number;
  pageSize: number;
  /** כמה תוצאות לכל ערך מסנן — מזין את המונים ליד הצ'קבוקסים */
  facets?: {
    categories: { slug: string; name: string; count: number }[];
    cities: { slug: string; name: string; count: number }[];
    tags: { slug: string; name: string; count: number }[];
  };
}
