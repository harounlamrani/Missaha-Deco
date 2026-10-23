"use client";

import { Package } from "lucide-react";
import type { Product } from "@/lib/types";

/**
 * Visuel produit : photo si disponible, sinon emplacement propre.
 * Aucune fausse photo réaliste n'est générée.
 */
export function ProductVisual({
  product,
  imageIndex = 0,
  className = "",
  sizes = "100vw",
}: {
  product: Product;
  imageIndex?: number;
  className?: string;
  sizes?: string;
}) {
  const img = product.images[imageIndex];
  if (img) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img.src} alt={img.alt} sizes={sizes} className={className} />;
  }
  return (
    <div
      role="img"
      aria-label={`Photo de ${product.name} à venir`}
      className={`flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-brand-yellow-soft to-line text-ink-soft ${className}`}
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
        <Package className="h-8 w-8 text-brand-orange-deep" aria-hidden />
      </span>
      <span className="px-4 text-center text-sm font-medium">
        Photo à venir
        <span className="mt-0.5 block text-xs font-normal">Réf. {product.ref}</span>
      </span>
    </div>
  );
}
