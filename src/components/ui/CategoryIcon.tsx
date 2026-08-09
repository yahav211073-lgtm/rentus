import {
  Accessibility, Activity, BadgeCheck, BookOpen, Building, Building2, Calculator,
  CalendarCheck, Camera, ChefHat, CircleParking, Clock, Disc3, Gavel, GraduationCap,
  Hammer, Hand, HardHat, HeartPulse, Home, Key, MapPin, MessageSquareQuote, Package,
  PartyPopper, PhoneCall, Presentation, ReceiptText, Scale, Scissors, ShieldCheck,
  Smile, Sparkle, Sparkles, Stethoscope, Store, Tag, Truck, Wind, Wrench, Zap, Car,
  type LucideIcon,
} from "lucide-react";

/**
 * מיפוי שם אייקון → רכיב.
 *
 * הקטגוריות שומרות שם אייקון כמחרוזת ("PartyPopper"), לא נתיב לקובץ.
 * המיפוי מפורש ולא דינמי (‎icons[name]‎ על כל החבילה) — כך רק
 * האייקונים שבאמת בשימוש נכנסים ל-bundle. ייבוא דינמי של lucide
 * מושך את כל 1,500 האייקונים.
 */
const ICONS: Record<string, LucideIcon> = {
  Accessibility, Activity, BadgeCheck, BookOpen, Building, Building2, Calculator,
  CalendarCheck, Camera, Car, ChefHat, CircleParking, Clock, Disc3, Gavel,
  GraduationCap, Hammer, Hand, HardHat, HeartPulse, Home, Key, MapPin,
  MessageSquareQuote, Package, PartyPopper, PhoneCall, Presentation, ReceiptText,
  Scale, Scissors, ShieldCheck, Smile, Sparkle, Sparkles, Stethoscope, Store,
  Truck, Wind, Wrench, Zap,
};

interface Props {
  name?: string | null;
  className?: string;
  strokeWidth?: number;
}

export function CategoryIcon({ name, className, strokeWidth = 2 }: Props) {
  const Icon = (name && ICONS[name]) || Tag;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
