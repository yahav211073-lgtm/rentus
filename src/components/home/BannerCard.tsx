"use client";

import { useEffect, useRef } from "react";
import { CoverArt } from "@/components/ui/CoverArt";
import type { Banner } from "@/types/domain";

/**
 * באנר סטטי בזרימת העמוד — לא הבאנר הצף (SideBanner), אלא אריח
 * שמככב בתוך רשת התוכן עצמה, בדיוק כמו בתמונת הרפרנס: עמודה שלמה
 * לצד כרטיסי העסקים, לא רק בשוליים למסכים רחבים במיוחד.
 */
export function BannerCard({ banner, className }: { banner: Banner; className?: string }) {
  const trackedRef = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || trackedRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !trackedRef.current) {
            trackedRef.current = true;
            void fetch("/api/ads/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bannerId: banner.id, type: "impression", path: window.location.pathname }),
              keepalive: true,
            }).catch(() => { /* התעלמות */ });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [banner.id]);

  function trackClick() {
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bannerId: banner.id, type: "click", path: window.location.pathname }),
      keepalive: true,
    }).catch(() => { /* התעלמות */ });
  }

  const content = (
    <div ref={ref} className="group relative h-full min-h-[280px] overflow-hidden">
      {banner.assetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.assetUrl}
          alt={banner.alt}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <CoverArt seed={banner.id} label={banner.title.charAt(0)} className="absolute inset-0 h-full w-full" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-950/85 via-brand-950/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <span className="mb-2 inline-block bg-accent-400 px-2 py-0.5 text-2xs font-bold text-brand-950">פרסומת</span>
        <h3 className="mb-3 font-display text-xl font-extrabold leading-tight text-white">{banner.title}</h3>
        <span className="inline-flex items-center gap-1.5 bg-white px-4 py-2 text-sm font-bold text-brand-900 transition-transform group-hover:-translate-y-0.5">
          לפרטים ←
        </span>
      </div>
    </div>
  );

  return (
    <div className={className}>
      {banner.href ? (
        <a
          href={banner.href}
          target={banner.href.startsWith("http") ? "_blank" : undefined}
          rel="noopener noreferrer sponsored"
          onClick={trackClick}
          className="block h-full"
        >
          {content}
        </a>
      ) : content}
    </div>
  );
}
