"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Phone, Trash2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/ui/icons";
import { formatRelative, toWhatsAppNumber } from "@/lib/utils";
import { deleteLead, updateLeadNote, updateLeadStatus } from "@/app/admin/leads/actions";
import { LEAD_STATUS_LABEL, type LeadStatus } from "@/lib/lead-status";

export interface AdminLead {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  channel: string | null;
  status: LeadStatus;
  ownerNote: string | null;
  sourcePage: string | null;
  createdAt: string;
  business: { name: string; slug: string } | null;
}

const STATUS_TONE: Record<LeadStatus, string> = {
  new: "bg-brand-50 text-brand-800 border-brand-200",
  contacted: "bg-warning-50 text-warning-700 border-warning-500/30",
  qualified: "bg-brand-50 text-brand-800 border-brand-200",
  won: "bg-success-50 text-success-700 border-success-500/30",
  lost: "bg-ink-100 text-ink-500 border-ink-200",
  spam: "bg-danger-50 text-danger-700 border-danger-500/30",
};

/**
 * רשימת הפניות.
 *
 * במובייל זו רשימת כרטיסים ולא טבלה שנגללת לצדדים. טבלה עם שש
 * עמודות בטלפון היא טבלה שאף אחד לא קורא, וניהול פניות קורה בדיוק
 * שם — בדרך, כשהטלפון ביד.
 */
export function LeadsTable({ leads }: { leads: AdminLead[] }) {
  return (
    <ul className="space-y-3">
      {leads.map((lead) => <LeadRow key={lead.id} lead={lead} />)}
    </ul>
  );
}

function LeadRow({ lead }: { lead: AdminLead }) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [note, setNote] = useState(lead.ownerNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError(res.error ?? "הפעולה נכשלה.");
    });
  }

  return (
    <li className="rounded-lg border border-ink-200/70 bg-white">
      <div className="flex flex-wrap items-start gap-3 p-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink-900">{lead.name ?? "ללא שם"}</span>
            <span className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${STATUS_TONE[lead.status]}`}>
              {LEAD_STATUS_LABEL[lead.status]}
            </span>
            <span className="text-2xs text-ink-400">{formatRelative(lead.createdAt)}</span>
          </div>

          <p className="text-sm text-ink-600">
            {lead.business ? (
              <Link href={`/business/${lead.business.slug}`} className="font-semibold text-brand-700 hover:text-brand-500">
                {lead.business.name}
              </Link>
            ) : (
              <span className="text-ink-400">פנייה כללית</span>
            )}
            {lead.phone && <span className="text-ink-400"> · {lead.phone}</span>}
            {lead.email && <span className="text-ink-400"> · {lead.email}</span>}
          </p>

          {lead.message && (
            <p className={`mt-1.5 text-sm text-ink-500 ${expanded ? "" : "line-clamp-2"}`}>
              {lead.message}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {lead.phone && (
            <>
              <a
                href={`tel:${lead.phone}`}
                aria-label={`חיוג ל${lead.name ?? "פנייה"}`}
                className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
              >
                <Phone className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={`https://wa.me/${toWhatsAppNumber(lead.phone)}`}
                target="_blank" rel="noopener noreferrer"
                aria-label="פתיחת וואטסאפ"
                className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "סגירת הפרטים" : "פתיחת הפרטים"}
            className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-ink-100 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor={`status-${lead.id}`} className="text-xs font-bold text-ink-600">סטטוס</label>
            <select
              id={`status-${lead.id}`}
              value={lead.status}
              disabled={pending}
              onChange={(e) => run(() => updateLeadStatus(lead.id, e.target.value))}
              className="h-9 rounded-xs border border-ink-200 bg-white px-2 text-sm outline-none focus:border-brand-400"
            >
              {Object.entries(LEAD_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (confirm("למחוק את הפנייה? הפעולה בלתי הפיכה.")) {
                  run(() => deleteLead(lead.id));
                }
              }}
              className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-xs px-2.5 text-xs font-bold text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              מחיקה
            </button>
          </div>

          <div>
            <label htmlFor={`note-${lead.id}`} className="mb-1 block text-xs font-bold text-ink-600">
              הערה פנימית
            </label>
            <div className="flex gap-2">
              <textarea
                id={`note-${lead.id}`}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                placeholder="מה סוכם בשיחה?"
                className="min-w-0 flex-1 rounded-xs border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              <button
                type="button"
                disabled={pending || note === (lead.ownerNote ?? "")}
                onClick={() => run(() => updateLeadNote(lead.id, note))}
                className="h-9 shrink-0 self-start rounded-xs bg-brand-800 px-4 text-xs font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-40"
              >
                שמירה
              </button>
            </div>
          </div>

          {lead.sourcePage && (
            <p className="text-2xs text-ink-400">הגיעה מ: {lead.sourcePage}</p>
          )}
          {error && <p role="alert" className="text-xs font-semibold text-danger-500">{error}</p>}
        </div>
      )}
    </li>
  );
}
