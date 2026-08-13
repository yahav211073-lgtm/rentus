"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteUserAccount, updateUserRole } from "@/app/admin/users/actions";

interface UserRow { id: string; email: string | null; fullName: string | null; role: string; createdAt: string }

const ROLES = [
  { value: "user", label: "משתמש" },
  { value: "business_owner", label: "בעל עסק" },
  { value: "editor", label: "עורך" },
  { value: "moderator", label: "מודרטור" },
  { value: "admin", label: "מנהל" },
];

export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200/70 bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
          <tr>
            <th className="px-4 py-3 text-start font-bold">שם</th>
            <th className="px-4 py-3 text-start font-bold">אימייל</th>
            <th className="px-4 py-3 text-start font-bold">תפקיד</th>
            <th className="px-4 py-3 text-start font-bold"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {users.map((u) => (
            <tr key={u.id}>
              <td className="px-4 py-3 font-bold text-ink-800">
                {u.fullName ?? "—"} {u.id === currentUserId && <span className="text-2xs font-normal text-ink-400">(אתם)</span>}
              </td>
              <td className="px-4 py-3 text-ink-500">{u.email}</td>
              <td className="px-4 py-3">
                <select
                  defaultValue={u.role}
                  disabled={pending}
                  onChange={(e) => startTransition(async () => { await updateUserRole(u.id, e.target.value); })}
                  className="h-9 rounded-sm border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400"
                >
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-end">
                {u.id !== currentUserId && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (confirm(`למחוק לצמיתות את החשבון של ${u.fullName ?? u.email}? הפעולה אינה הפיכה.`)) {
                        startTransition(async () => { await deleteUserAccount(u.id); });
                      }
                    }}
                    aria-label={`מחיקת החשבון של ${u.fullName ?? u.email}`}
                    className="grid h-8 w-8 place-items-center rounded-sm text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
