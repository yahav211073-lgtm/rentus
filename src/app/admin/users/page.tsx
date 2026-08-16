import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata = { title: "משתמשים", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  if (!supabase || !user) return null;

  const [{ data: users }, { data: owned }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase.from("businesses").select("owner_id").not("owner_id", "is", null),
  ]);

  const ownedCount = new Map<string, number>();
  for (const b of owned ?? []) {
    if (b.owner_id) ownedCount.set(b.owner_id, (ownedCount.get(b.owner_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-extrabold text-ink-900">משתמשים</h1>
      <p className="mb-6 text-sm text-ink-500">
        שינוי תפקיד נשמר במסד ונכנס לתוקף בטעינת העמוד הבאה של אותו משתמש — גם בלי התנתקות.
      </p>
      <UsersTable
        users={(users ?? []).map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.full_name,
          role: u.role,
          createdAt: u.created_at,
          businessCount: ownedCount.get(u.id) ?? 0,
        }))}
        currentUserId={user.id}
      />
    </div>
  );
}
