/**
 * אייקונים ממותגים ש-lucide-react הסיר מהספרייה (בעיות סימן מסחר).
 * מצוירים באותו סגנון — stroke, viewBox 24, קצוות עגולים — כדי שלא
 * יבלטו לצד שאר האייקונים מ-lucide.
 */
export function InstagramIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function FacebookIcon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true"
    >
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.2l.8-4H14V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

/**
 * וואטסאפ — הסמל המלא ולא קווי.
 * זה הסמל שאנשים מזהים מיידית, וזיהוי מיידי הוא כל התפקיד של
 * כפתור וואטסאפ. הצבע נשלט מבחוץ דרך currentColor כדי שאפשר יהיה
 * להשתמש בו גם על רקע ירוק וגם כאייקון ניטרלי ברשימה.
 */
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.13a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.27-4.36c0-4.55 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.22-8.24 8.22m4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.08.14-1.18-.06-.11-.22-.17-.47-.29" />
    </svg>
  );
}

/**
 * Waze — צורת הבועה עם החיוך ושתי העיניים, מצוירת כמסלול מלא אחד
 * כדי שתעבוד ב-currentColor בדיוק כמו שאר האייקונים כאן. אין
 * ל-lucide אייקון Waze, ואייקון ניווט גנרי לא נקרא כ"Waze".
 */
export function WazeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c-4.9 0-8.9 3.6-8.9 8.1 0 1.2.3 2.3.8 3.4-.5.7-1.3 1.3-2 1.6-.5.2-.7.8-.5 1.3.2.4.5.6.9.6 1.7 0 3.2-.6 4.3-1.4a10 10 0 0 0 2.7.9 3.2 3.2 0 0 0 6.2.5c3.3-1.1 5.5-3.8 5.5-7A8.1 8.1 0 0 0 12 2.2m-2.6 5.3a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3m5.2 0a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3m-6.2 4.6h7.2c.4 0 .7.3.7.7 0 2.2-1.9 3.9-4.3 3.9s-4.3-1.7-4.3-3.9c0-.4.3-.7.7-.7" />
    </svg>
  );
}

export function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 1 1 .77-5.06V9.7a5.67 5.67 0 0 0-.77-.05A5.67 5.67 0 1 0 15.54 15.3V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48" />
    </svg>
  );
}

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42a2.51 2.51 0 0 0-1.77 1.77A26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81M10 15.02V8.98L15.2 12z" />
    </svg>
  );
}

/** לוגו Google — רב-צבעי במקור, ולכן לא stroke-icon כמו האחרים. */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.25v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.25A12 12 0 0 0 0 12c0 1.94.46 3.77 1.25 5.38l4.02-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.25 6.62l4.02 3.1C6.22 6.86 8.87 4.75 12 4.75z" />
    </svg>
  );
}
