"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, Trash2 } from "lucide-react";
import { formatRelative } from "@/lib/utils";
import { deleteUserAccount, updateUserRole } from "@/app/admin/users/actions";

interface UserRow {
  id: string;
  email: string | null;
  fullName: string | null;
  role: string;
  createdAt: string;
  businessCount: number;
}

const ROLES = [
  { value: "user", label: "משתמש" },
  { value: "business_owner", label: "בעל עסק" },
  { value: "editor", label: "עורך" },
  { value: "moderator", label: "מנהל תוכן" },
  { value: "admin", label: "מנהל ראשי" },
];

const STAFF = new Set(["admin", "moderator", "editor"]);

/**
 * ניהול משתמשים.
 *
 * שינוי תפקיד מציג שגיאה כשהוא נחסם, במקום להיכשל בשקט. זה חשוב
 * במיוחד כאן: יש טריגר במסד שמאפשר שינוי תפקידים למנהל ראשי בלבד,
 * ובלי הודעה המשתמש היה רואה את הבורר קופץ חזרה בלי הסבר וחושב
 * שהמערכת שבורה.
 */
export function UsersTable({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okId?: string) {
    startTransition(async () => {
      setError(null);
      setSaved(null);
      const res = await fn();
      if (res.ok) setSaved(okId ?? null);
      else setError(res.error ?? "הפעולה נכשלה.");
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-ink-200/70 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <caption className="sr-only">רשימת המשתמשים הרשומים והתפקידים שלהם</caption>
          <thead className="border-b border-ink-100 bg-ink-50 text-xs text-ink-500">
            <tr>
              <th scope="col" className="px-4 py-3 text-start font-bold">שם</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">אימייל</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">נרשם</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">תפקיד</th>
              <th scope="col" className="px-4 py-3 text-start font-bold">
                <span className="sr-only">פעולות</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {users.map((u) => {
              const isMe = u.id === currentUserId;
              return (
                <tr key={u.id} className={saved === u.id ? "bg-success-50/60" : undefined}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 font-bold text-ink-800">
                      {STAFF.has(u.role) && (
                        <ShieldCheck className="h-3.5 w-3.5 text-brand-600" aria-label="חבר צוות" />
                      )}
                      {u.fullName ?? "—"}
                      {isMe && <span className="text-2xs font-normal text-ink-400">(אתם)</span>}
                    </span>
                    {u.businessCount > 0 && (
                      <span className="text-2xs text-ink-400">{u.businessCount} עסקים בבעלותו</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500" dir="ltr">{u.email ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-2xs text-ink-400">
                    {formatRelative(u.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={pending || isMe}
                      aria-label={`תפקיד של ${u.fullName ?? u.email}`}
                      onChange={(e) => {
                        const next = e.target.value;
                        if (STAFF.has(next) && !STAFF.has(u.role)) {
                          if (!confirm(
                            `להפוך את ${u.fullName ?? u.email} למנהל? תהיה לו גישה מלאה למערכת הניהול.`,
                          )) {
                            return;
                          }
                        }
                        run(() => updateUserRole(u.id, next), u.id);
                      }}
                      className="h-9 rounded-xs border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400 disabled:bg-ink-50 disabled:text-ink-400"
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-end">
                    {!isMe && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (confirm(
                            `למחוק לצמיתות את החשבון של ${u.fullName ?? u.email}? הפעולה אינה הפיכה.`,
                          )) {
                            run(() => deleteUserAccount(u.id));
                          }
                        }}
                        aria-label={`מחיקת החשבון של ${u.fullName ?? u.email}`}
                        className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-2xs text-ink-400">
        ״מנהל ראשי״, ״מנהל תוכן״ ו״עורך״ מקבלים גישה למערכת הניהול. ההרשאה נבדקת בשרת בכל פעולה,
        ולא רק בהסתרת כפתורים.
      </p>
    </div>
  );
}
