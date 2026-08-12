"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, X } from "lucide-react";
import { approveBusiness, rejectBusiness, setBusinessArchived } from "@/app/admin/businesses/actions";

export function ApproveRejectButtons({ businessId }: { businessId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  if (rejecting) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="סיבת דחייה..."
          className="h-8 w-36 rounded-xs border border-ink-200 px-2 text-xs outline-none focus:border-brand-400"
        />
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => { await rejectBusiness(businessId, reason); })}
          className="rounded-xs bg-danger-500 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-danger-500/90 disabled:opacity-50"
        >
          אישור דחייה
        </button>
        <button
          type="button"
          onClick={() => setRejecting(false)}
          className="text-xs text-ink-400 hover:text-ink-700"
        >
          ביטול
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(async () => { await approveBusiness(businessId); })}
        className="inline-flex items-center gap-1 rounded-xs bg-success-500 px-2.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-success-500/90 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" /> אישור
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => setRejecting(true)}
        className="inline-flex items-center gap-1 rounded-xs border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" /> דחייה
      </button>
    </div>
  );
}

export function ArchiveToggleButton({ businessId, isArchived }: { businessId: string; isArchived: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => { await setBusinessArchived(businessId, !isArchived); })}
      className="inline-flex items-center gap-1 rounded-xs border border-ink-200 px-2.5 py-1.5 text-xs font-bold text-ink-600 transition-colors hover:bg-ink-50 disabled:opacity-50"
    >
      {isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
      {isArchived ? "שחזור" : "העברה לארכיון"}
    </button>
  );
}
