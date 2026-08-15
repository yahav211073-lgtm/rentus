import {
  Accessibility, Activity, Armchair, BadgeCheck, Bike, BookOpen, Building, Building2,
  Calculator, CalendarCheck, Camera, Car, ChefHat, CircleParking, Clock, Container,
  Disc3, Drill, Dumbbell, Forklift, Gavel, GraduationCap, Hammer, Hand, HardHat,
  Headphones, HeartPulse, Home, House, Key, MapPin, MessageSquareQuote, Monitor,
  Music, Package, PartyPopper, PhoneCall, Presentation, Projector, ReceiptText,
  Scale, Scissors, ShieldCheck, Smile, Sofa, Sparkle, Sparkles, Stethoscope, Store,
  Tag, Tent, Trees, Truck, Warehouse, Waves, Wind, Wrench, Zap,
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
  Accessibility, Activity, Armchair, BadgeCheck, Bike, BookOpen, Building, Building2,
  Calculator, CalendarCheck, Camera, Car, ChefHat, CircleParking, Clock, Container,
  Disc3, Drill, Dumbbell, Forklift, Gavel, GraduationCap, Hammer, Hand, HardHat,
  Headphones, HeartPulse, Home, House, Key, MapPin, MessageSquareQuote, Monitor,
  Music, Package, PartyPopper, PhoneCall, Presentation, Projector, ReceiptText,
  Scale, Scissors, ShieldCheck, Smile, Sofa, Sparkle, Sparkles, Stethoscope, Store,
  Tent, Trees, Truck, Warehouse, Waves, Wind, Wrench, Zap,
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
