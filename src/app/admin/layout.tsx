import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

/**
 * מעטפת האדמין.
 *
 * ההרשאה נבדקת כאן **בנוסף** ל-proxy.ts, ולא במקומו. זו לא כפילות
 * מיותרת: ה-proxy רץ ברמת הבקשה ומגן על הנתיב, אבל אם מישהו ישנה
 * את ה-matcher שלו בעתיד, השכבה הזו היא מה שמונע מהמסכים להיטען.
 * הגנה בשכבה אחת בלבד היא הגנה שנשברת בשקט ברפקטור הבא.
 *
 * שכבת ההגנה השלישית והחשובה ביותר היא requireStaff() בכל Server
 * Action — היא זו שמגנה על הכתיבה עצמה, לא רק על הצפייה במסך.
 */
const STAFF_ROLES = ["admin", "moderator", "editor"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/login?next=/admin");
  if (!STAFF_ROLES.includes(user.role)) redirect("/403");

  return (
    <AdminShell userName={user.fullName ?? user.email ?? "מנהל"} role={user.role}>
      {children}
    </AdminShell>
  );
}
