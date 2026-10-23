"use client";

import { useState } from "react";
import { Check, Minus, Plus, ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/types";
import { effectivePrice } from "@/data/products";
import { formatDA } from "@/lib/format";
import { SITE } from "@/lib/site";
import { useShop } from "@/lib/store";

function AvailabilityBadge({ value }: { value: Product["availability"] }) {
  if (value === "available")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700">
        <Check className="h-4 w-4" aria-hidden /> Disponible
      </span>
    );
  if (value === "preorder")
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-yellow-soft px-3 py-1 text-sm font-semibold text-brand-orange-deep">
        Précommande
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-ink-soft">
      Indisponible
    </span>
  );
}

export function ProductSection({ product }: { product: Product }) {
  const { draftItems, setDraftItems } = useShop();
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [qty, setQty] = useState(1);

  const available = product.availability === "available";

  function scrollToOrder() {
    if (!available) return;
    const existing = draftItems.find((d) => d.productId === product.id);
    if (existing) {
      setDraftItems(
        draftItems.map((d) =>
          d.productId === product.id
            ? { ...d, color: color || d.color, quantity: Math.min(99, d.quantity + qty) }
            : d,
        ),
      );
    } else {
      setDraftItems([...draftItems, { productId: product.id, color, quantity: qty }]);
    }
    document.getElementById("commander")?.scrollIntoView({ behavior: "smooth" });
  }

  const rows: Array<[string, string]> = [
    ["Dimensions", product.dimensions ?? ""],
    ["Matière", product.material ?? ""],
    ["Installation", product.installation ?? ""],
    ["Contenu du colis", product.packaging ?? ""],
  ].filter(([, v]) => v.trim() !== "") as Array<[string, string]>;

  return (
    <section id="produits" aria-labelledby="produit-nom" className="scroll-mt-20 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
        {/* Détails */}
        <div>
          <AvailabilityBadge value={product.availability} />
          <h2 id="produit-nom" className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            {product.category} · Réf. {product.ref}
          </p>
          <p className="mt-3 text-3xl font-bold text-ink">
            {formatDA(effectivePrice(product))}
            {product.promoPrice && (
              <span className="ml-3 align-middle text-lg font-normal text-ink-soft line-through">
                {formatDA(product.price)}
              </span>
            )}
          </p>
          <p className="mt-4 leading-7 text-ink-soft">{product.description}</p>

          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-ink">
                Couleur : <span className="font-normal text-ink-soft">{color}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur">
                {product.colors.map((c) => {
                  const selected = c.name === color;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setColor(c.name)}
                      className={`flex min-h-11 items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium transition ${
                        selected ? "border-ink bg-paper" : "border-line hover:border-ink/40"
                      }`}
                    >
                      <span
                        aria-hidden
                        className="h-5 w-5 rounded-full border border-line"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {rows.length > 0 && (
            <dl className="mt-6 divide-y divide-line rounded-2xl border border-line">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-3 px-4 py-3 text-sm">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="col-span-2 text-ink-soft">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {product.installVideoUrl && (
            <a
              href={product.installVideoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-brand-orange-deep underline underline-offset-4"
            >
              Voir la vidéo de montage
            </a>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-line">
              <button
                type="button"
                aria-label="Diminuer la quantité"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-12 w-12 items-center justify-center rounded-l-full hover:bg-paper"
              >
                <Minus className="h-5 w-5" aria-hidden />
              </button>
              <span aria-live="polite" aria-label={`Quantité : ${qty}`} className="w-10 text-center text-lg font-bold">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Augmenter la quantité"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="flex h-12 w-12 items-center justify-center rounded-r-full hover:bg-paper"
              >
                <Plus className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={scrollToOrder}
              disabled={!available}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-ink px-6 text-base font-bold text-white transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              {available ? "Commander" : "Indisponible"}
            </button>
          </div>

          <p className="mt-4 rounded-2xl bg-brand-yellow-soft px-4 py-3 text-sm font-medium text-ink">
            {SITE.paymentNote} — payez uniquement à la réception de votre colis.
          </p>
        </div>
      </div>
    </section>
  );
}
