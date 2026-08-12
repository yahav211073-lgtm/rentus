import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { UsersTable } from "@/components/admin/UsersTable";

export const metadata = { title: "משתמשים", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const [user, supabase] = await Promise.all([getCurrentUser(), createSupabaseServerClient()]);
  const { data: users } = await supabase!
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink-900">משתמשים</h1>
      <UsersTable
        users={(users ?? []).map((u) => ({
          id: u.id, email: u.email, fullName: u.full_name, role: u.role, createdAt: u.created_at,
        }))}
        currentUserId={user!.id}
      />
    </div>
  );
}
