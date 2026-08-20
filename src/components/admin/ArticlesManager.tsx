"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink, FileText, ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { createArticle, deleteArticle, setArticleStatus, updateArticle } from "@/app/admin/articles/actions";

export interface AdminArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string[];
  coverUrl: string | null;
  coverAlt: string | null;
  status: string;
  isFeatured: boolean;
  readingMin: number | null;
  publishedAt: string | null;
  categoryId: string | null;
}

interface ArticleCategory { id: string; name: string }

const STATUS_LABEL: Record<string, string> = {
  draft: "טיוטה",
  published: "מפורסם",
  archived: "בארכיון",
};

const STATUS_TONE: Record<string, string> = {
  draft: "bg-ink-100 text-ink-500 border-ink-200",
  published: "bg-success-50 text-success-700 border-success-500/30",
  archived: "bg-ink-100 text-ink-400 border-ink-200",
};

/**
 * ניהול מאמרים.
 *
 * העורך הוא שדה טקסט של פסקאות ולא WYSIWYG — זה מכסה את מה שהתצוגה
 * באמת יודעת לרנדר (פסקאות), ולא מבטיח יכולות עיצוב שלא קיימות
 * בעמוד המאמר. עורך שמציג כפתור "טבלה" שלא עושה כלום הוא הבטחה
 * שבורה, לא פיצ'ר.
 */
export function ArticlesManager({
  articles, categories,
}: { articles: AdminArticle[]; categories: ArticleCategory[] }) {
  const [editing, setEditing] = useState<AdminArticle | "new" | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onDone?: () => void) {
    startTransition(async () => {
      setError(null);
      const res = await fn();
      if (res.ok) onDone?.();
      else setError(res.error ?? "הפעולה נכשלה.");
    });
  }

  return (
    <div className="space-y-5">
      {error && (
        <p role="alert" className="rounded-sm border border-danger-500/30 bg-danger-50 px-4 py-2 text-sm font-semibold text-danger-700">
          {error}
        </p>
      )}

      {editing ? (
        <ArticleForm
          article={editing === "new" ? null : editing}
          categories={categories}
          pending={pending}
          onCancel={() => setEditing(null)}
          onSubmit={(fd) =>
            run(
              () => (editing === "new" ? createArticle(fd) : updateArticle(editing.id, fd)),
              () => setEditing(null),
            )
          }
        />
      ) : (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="accent"
            size="md"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setEditing("new")}
          >
            מאמר חדש
          </Button>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ink-300 bg-white px-6 py-16 text-center">
          <FileText className="mx-auto mb-3 h-8 w-8 text-ink-300" aria-hidden="true" />
          <p className="font-display text-lg font-bold text-ink-800">עדיין אין מאמרים</p>
          <p className="mt-1 text-sm text-ink-500">המאמר הראשון שתפרסמו יופיע גם בעמוד הבית.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-lg border border-ink-200/70 bg-white p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-sm border border-ink-200 bg-ink-50">
                {a.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="grid h-full w-full place-items-center text-ink-300">
                    <ImageOff className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink-900">{a.title}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-2xs font-bold ${STATUS_TONE[a.status] ?? STATUS_TONE.draft}`}>
                    {STATUS_LABEL[a.status] ?? a.status}
                  </span>
                  {a.isFeatured && (
                    <span className="rounded-full border border-accent-300 bg-accent-50 px-2 py-0.5 text-2xs font-bold text-accent-700">
                      מודגש
                    </span>
                  )}
                </div>
                {a.excerpt && <p className="line-clamp-1 text-sm text-ink-500">{a.excerpt}</p>}
                <p className="mt-0.5 text-2xs text-ink-400">
                  {a.content.length} פסקאות · {a.readingMin ?? "?"} דקות קריאה
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                {a.status === "published" && (
                  <Link
                    href={`/blog/${a.slug}`}
                    target="_blank"
                    aria-label="צפייה במאמר באתר"
                    className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  </Link>
                )}
                <select
                  value={a.status}
                  disabled={pending}
                  aria-label={`סטטוס של ${a.title}`}
                  onChange={(e) =>
                    run(() => setArticleStatus(a.id, e.target.value as "draft" | "published" | "archived"))
                  }
                  className="h-9 rounded-xs border border-ink-200 bg-white px-2 text-xs font-semibold outline-none focus:border-brand-400"
                >
                  {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setEditing(a)}
                  aria-label={`עריכת ${a.title}`}
                  className="grid h-9 w-9 place-items-center rounded-xs border border-ink-200 text-ink-500 transition-colors hover:border-brand-300 hover:text-brand-700"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (confirm(`למחוק את "${a.title}"? הפעולה בלתי הפיכה.`)) run(() => deleteArticle(a.id));
                  }}
                  aria-label={`מחיקת ${a.title}`}
                  className="grid h-9 w-9 place-items-center rounded-xs text-ink-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ArticleForm({
  article, categories, pending, onCancel, onSubmit,
}: {
  article: AdminArticle | null;
  categories: ArticleCategory[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <form
      action={onSubmit}
      className="rounded-lg border border-brand-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-base text-ink-900">
          {article ? "עריכת מאמר" : "מאמר חדש"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          aria-label="סגירת הטופס"
          className="grid h-8 w-8 place-items-center rounded-xs text-ink-400 hover:bg-ink-100"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="כותרת" required className="sm:col-span-2">
          <input
            name="title"
            defaultValue={article?.title}
            required
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </Field>

        <Field label="תקציר" hint="מוצג בכרטיס המאמר ובתוצאות חיפוש" className="sm:col-span-2">
          <textarea
            name="excerpt"
            defaultValue={article?.excerpt ?? ""}
            rows={2}
            className="w-full rounded-xs border border-ink-200 px-3.5 py-2 text-base outline-none focus:border-brand-400"
          />
        </Field>

        <Field label="קטגוריה">
          <select
            name="categoryId"
            defaultValue={article?.categoryId ?? ""}
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
          >
            <option value="">ללא קטגוריה</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>

        <Field label="סטטוס">
          <select
            name="status"
            defaultValue={article?.status ?? "draft"}
            className="h-11 w-full rounded-xs border border-ink-200 bg-white px-3 text-base outline-none focus:border-brand-400"
          >
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>

        <ImageUploadField
          name="cover"
          label="תמונת שער"
          currentUrl={article?.coverUrl}
          hint="מומלץ ביחס 16:9 · JPG/PNG/WebP עד 5MB"
          className="sm:col-span-2"
        />

        <Field label="טקסט חלופי לתמונה" hint="לנגישות ולקוראי מסך" className="sm:col-span-2">
          <input
            name="coverAlt"
            defaultValue={article?.coverAlt ?? ""}
            className="h-11 w-full rounded-xs border border-ink-200 px-3.5 text-base outline-none focus:border-brand-400"
          />
        </Field>

        <Field
          label="תוכן המאמר"
          required
          hint="שורה ריקה מפרידה בין פסקאות. זמן הקריאה מחושב אוטומטית."
          className="sm:col-span-2"
        >
          <textarea
            name="content"
            defaultValue={article?.content.join("\n\n") ?? ""}
            required
            rows={14}
            className="w-full rounded-xs border border-ink-200 px-3.5 py-3 text-base leading-relaxed outline-none focus:border-brand-400"
          />
        </Field>

        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700 sm:col-span-2">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={article?.isFeatured}
            className="h-4 w-4 accent-brand-700"
          />
          מאמר מודגש
        </label>
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="submit" variant="primary" size="md" loading={pending}>
          {article ? "שמירת שינויים" : "יצירת מאמר"}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>ביטול</Button>
      </div>
    </form>
  );
}

function Field({
  label, hint, required, className, children,
}: {
  label: string; hint?: string; required?: boolean; className?: string; children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="text-xs font-bold text-ink-600">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </span>
      {children}
      {hint && <span className="text-2xs text-ink-400">{hint}</span>}
    </label>
  );
}
