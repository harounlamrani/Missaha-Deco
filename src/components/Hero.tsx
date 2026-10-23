"use client";

import type { CSSProperties } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { effectivePrice } from "@/data/products";
import { formatDA } from "@/lib/format";

/** Délais/durées de l'entrée cinématique (CSS pur, 0 dépendance JS). */
const ENTRANCE = {
  visual: { "--hero-delay": "0ms", "--hero-dur": "900ms" },
  eyebrow: { "--hero-delay": "450ms", "--hero-dur": "600ms" },
  headline: { "--hero-delay": "650ms", "--hero-dur": "850ms" },
  description: { "--hero-delay": "950ms", "--hero-dur": "700ms" },
  ctas: { "--hero-delay": "1200ms", "--hero-dur": "650ms" },
} as Record<string, CSSProperties>;

export function Hero({ products, onOrder }: {
  products: Product[];
  onOrder: (p: Product) => void;
}) {
  const active = products[0];

  if (!active) return null;

  return (
    <section
      id="accueil"
      aria-label="Présentation MISSAHA DECO"
      className="relative overflow-hidden bg-[#f5eee7] h-[calc(100svh-88px)] md:h-auto md:min-h-[92svh]"
    >
      {/* Meuble (détouré) : part hors écran à gauche et glisse vers la droite.
          Mobile : centré verticalement entre navbar (64px) et barre "Commander"
          (100svh-88px) via flex + pt-16 ; desktop : ancré en bas-gauche */}
      <div
        aria-hidden
        className="hero-slide-box pointer-events-none absolute inset-0 z-[5] flex items-center pt-16 md:items-end md:pt-0"
      >
        <img
          src="/images/meuble-hero3.webp"
          alt=""
          className="hero-slide w-[53%] h-auto drop-shadow-[14px_20px_30px_rgba(28,25,23,0.12)] md:w-auto md:h-[94%]"
        />
      </div>

      {/* Bloc info : superposé à droite (mobile), colonne droite (desktop) */}
      <div className="absolute inset-x-0 top-1/2 z-10 -translate-y-1/2 px-4 sm:px-6 md:static md:mx-auto md:flex md:w-full md:max-w-6xl md:min-h-[92svh] md:translate-y-0 md:items-center md:px-4 md:py-24">
        <div className="ml-auto w-[47%] text-center text-ink md:w-full md:max-w-md md:text-left">
          <div className="hero-item hidden md:block" style={ENTRANCE.eyebrow}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-orange-deep sm:text-[11px] md:tracking-[0.18em] md:text-xs">
              {active.category} · Réf. {active.ref}
            </p>
          </div>

          <div className="hero-item" style={ENTRANCE.headline}>
            <h1 className="max-md:text-[clamp(20px,6.2vw,27px)] font-bold leading-[1.18] tracking-tight text-ink md:text-3xl md:leading-tight lg:text-4xl xl:text-5xl">
              {active.name}
            </h1>
          </div>

          <div className="hero-item max-md:mt-3 md:mt-4" style={ENTRANCE.description}>
            <p className="max-md:text-[13px] max-md:leading-[1.5] text-ink-soft md:text-base md:leading-7">
              {active.shortDescription}
            </p>
            <p className="max-md:mt-3 md:mt-4 max-md:text-xl font-bold text-ink md:text-2xl">
              {formatDA(effectivePrice(active))}
              {active.promoPrice && (
                <span className="ml-2 align-middle text-xs font-normal text-ink-soft line-through max-md:text-[13px] sm:ml-3 sm:text-base">
                  {formatDA(active.price)}
                </span>
              )}
            </p>
          </div>

          <div className="hero-item max-md:mt-4 mt-6 flex flex-col gap-2 sm:gap-3 md:mt-6 md:flex-row" style={ENTRANCE.ctas}>
            <button
              type="button"
              onClick={() => onOrder(active)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-yellow px-4 text-xs font-bold text-ink shadow-sm transition hover:bg-brand-orange hover:text-white active:scale-[0.98] sm:h-13 sm:px-8 sm:text-base"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              Commander
            </button>
            <a
              href="#produits"
              className="inline-flex h-10 items-center justify-center rounded-full border border-line bg-white px-4 text-xs font-semibold text-ink transition hover:border-ink sm:h-13 sm:px-8 sm:text-base"
            >
              Voir le détail
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
