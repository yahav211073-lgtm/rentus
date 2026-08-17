/**
 * סטטוסי פנייה. קובץ נפרד מ-admin/leads/actions.ts בכוונה: קובץ
 * "use server" מותר לו לייצא רק פונקציות async — קבוע נתונים כמו
 * LEAD_STATUS_LABEL שם היה שובר את ה-build (ראו את התיקון שהוביל לכך).
 */
export const STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: "חדשה",
  contacted: "יצרנו קשר",
  qualified: "רלוונטית",
  won: "נסגרה בהצלחה",
  lost: "לא רלוונטית",
  spam: "ספאם",
};
