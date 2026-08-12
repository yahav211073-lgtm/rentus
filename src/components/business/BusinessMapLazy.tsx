"use client";

import dynamic from "next/dynamic";

/**
 * עטיפת client בלבד: `ssr:false` עם next/dynamic אסור בתוך Server
 * Component (Leaflet נוגע ב-window ולא שורד רינדור בשרת), אז חובה
 * שהקריאה עצמה תשב ברכיב client נפרד.
 */
export const BusinessMap = dynamic(
  () => import("@/components/business/BusinessMapView").then((m) => m.BusinessMapView),
  { ssr: false, loading: () => <div className="h-64 w-full animate-pulse rounded-lg bg-ink-100" /> },
);
