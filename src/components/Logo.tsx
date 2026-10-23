"use client";

import { useState } from "react";
import { SITE } from "@/lib/site";

/**
 * Logo : fichier réel /logo.jpg (fourni par la marque, photos + wordmark).
 * Repli typographique fidèle si le fichier est absent.
 */
export function Logo({ compact = false }: { compact?: boolean }) {
  const [hasFile, setHasFile] = useState(true);
  return (
    <span className="inline-flex items-center gap-2.5" aria-label={`${SITE.brandDisplay} — ${SITE.brandAr}`}>
      {hasFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/logo.jpg"
          alt="missaha DECO — مساحة"
          className={`rounded-xl object-cover shadow-sm ${compact ? "h-9 w-9" : "h-11 w-11"}`}
          onError={() => setHasFile(false)}
        />
      ) : (
        <>
          <span
            aria-hidden
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-orange text-lg font-bold text-white"
          >
            م
          </span>
          <span className="leading-none">
            <span className="block text-lg font-bold tracking-tight text-ink">
              {SITE.brand}
            </span>
            <span
              className="block text-sm text-ink-soft"
              dir="rtl"
              lang="ar"
            >
              {SITE.brandAr}
            </span>
          </span>
        </>
      )}
    </span>
  );
}
