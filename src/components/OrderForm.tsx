"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import type { DeliveryMethod, Quote } from "@/lib/types";
import {
  calculateDeliveryPrice,
  deliveryMethods,
  getWilayaById,
  wilayas,
} from "@/lib/delivery";
import { formatDA, isValidDzPhone } from "@/lib/format";
import { useShop } from "@/lib/store";

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-white px-4 text-base text-ink placeholder:text-ink-soft/60 focus:border-brand-orange-deep focus:outline-none";
const labelCls = "mb-1.5 block text-sm font-semibold text-ink";
const errCls = "mt-1 text-sm text-red-700";

export function OrderForm({ onQuoted }: { onQuoted: (q: Quote) => void }) {
  const {
    catalog,
    draftItems,
    customer,
    setCustomer,
    deliveryMethod,
    setDeliveryMethod,
  } = useShop();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  /* the basket is chosen in the product section — the quantity
     stepper lives there, so this form only carries identity,
     delivery and the quote button */
  const detailed = useMemo(
    () =>
      draftItems
        .map((d) => ({ draft: d, product: catalog.find((p) => p.id === d.productId) }))
        .filter((x) => x.product && x.product.availability === "available"),
    [draftItems, catalog],
  );

  function set<K extends keyof typeof customer>(key: K, value: (typeof customer)[K]) {
    setCustomer({ ...customer, [key]: value });
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const errs: Record<string, string> = {};
    if (detailed.length === 0) {
      setServerError("Sélectionnez d'abord le produit et la quantité dans la section produit.");
      document.getElementById("produits")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (customer.fullName.trim().length < 3) errs.fullName = "Indiquez votre nom complet.";
    if (!isValidDzPhone(customer.phone)) errs.phone = "Numéro algérien invalide (ex. 0562 07 35 08).";
    if (!getWilayaById(customer.wilayaId)) errs.wilayaId = "Sélectionnez votre wilaya.";
    if (customer.commune.trim().length < 2) errs.commune = "Indiquez votre commune.";
    if (customer.address.trim().length < 5) errs.address = "Indiquez votre adresse de livraison.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/order/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: detailed.map((x) => ({
            productId: x.draft.productId,
            color: x.draft.color,
            quantity: x.draft.quantity,
          })),
          customer,
          deliveryMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.errors) setErrors(data.errors as Record<string, string>);
        else setServerError("Erreur lors du calcul du devis. Réessayez.");
        return;
      }
      onQuoted(data as Quote);
      document.getElementById("devis")?.scrollIntoView({ behavior: "smooth" });
    } catch {
      setServerError("Connexion impossible. Vérifiez internet et réessayez.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate aria-labelledby="commander-titre">
      {/* Infos client */}
      <div className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
        <div>
          <label htmlFor="f-fullName" className={labelCls}>Nom complet *</label>
          <input
            id="f-fullName"
            className={inputCls}
            autoComplete="name"
            value={customer.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={!!errors.fullName}
            placeholder="Ex. Amine Benali"
          />
          {errors.fullName && <p className={errCls} role="alert">{errors.fullName}</p>}
        </div>
        <div>
          <label htmlFor="f-phone" className={labelCls}>Téléphone *</label>
          <input
            id="f-phone"
            className={inputCls}
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={customer.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={!!errors.phone}
            placeholder="Ex. 0562 07 35 08"
          />
          {errors.phone && <p className={errCls} role="alert">{errors.phone}</p>}
        </div>
        <div>
          <label htmlFor="f-wilaya" className={labelCls}>Wilaya *</label>
          <select
            id="f-wilaya"
            className={inputCls}
            value={customer.wilayaId || ""}
            onChange={(e) => set("wilayaId", Number(e.target.value))}
            aria-invalid={!!errors.wilayaId}
          >
            <option value="">— Sélectionnez —</option>
            {wilayas.map((w) => (
              <option key={w.id} value={w.id}>
                {w.id} — {w.name}
              </option>
            ))}
          </select>
          {errors.wilayaId && <p className={errCls} role="alert">{errors.wilayaId}</p>}
        </div>
        <div>
          <label htmlFor="f-commune" className={labelCls}>Commune *</label>
          <input
            id="f-commune"
            className={inputCls}
            autoComplete="address-level2"
            value={customer.commune}
            onChange={(e) => set("commune", e.target.value)}
            aria-invalid={!!errors.commune}
            placeholder="Ex. Bab Ezzouar"
          />
          {errors.commune && <p className={errCls} role="alert">{errors.commune}</p>}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="f-address" className={labelCls}>Adresse de livraison *</label>
          <input
            id="f-address"
            className={inputCls}
            autoComplete="street-address"
            value={customer.address}
            onChange={(e) => set("address", e.target.value)}
            aria-invalid={!!errors.address}
            placeholder="Rue, cité, point de repère…"
          />
          {errors.address && <p className={errCls} role="alert">{errors.address}</p>}
        </div>
      </div>

      {/* Mode de livraison */}
      <fieldset className="mt-5 rounded-2xl border border-line bg-white p-5">
        <legend className="px-1 text-sm font-semibold text-ink">Mode de livraison *</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(deliveryMethods) as DeliveryMethod[]).map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 p-4 transition ${
                deliveryMethod === m ? "border-ink bg-paper" : "border-line hover:border-ink/40"
              }`}
            >
              <span>
                <span className="block text-sm font-bold text-ink">
                  {deliveryMethods[m].label}
                </span>
                <span className="mt-0.5 block text-xs text-ink-soft">
                  {deliveryMethods[m].description}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-sm font-bold text-ink">
                  {customer.wilayaId ? formatDA(calculateDeliveryPrice(customer.wilayaId, m)) : "—"}
                </span>
                <input
                  type="radio"
                  name="deliveryMethod"
                  checked={deliveryMethod === m}
                  onChange={() => setDeliveryMethod(m)}
                  className="h-5 w-5 accent-[#1c1917]"
                />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {serverError && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-yellow px-8 py-3.5 text-base font-bold text-ink transition hover:bg-brand-orange hover:text-white active:scale-[0.99] disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            Calcul du devis…
          </>
        ) : (
          "Vérifier et générer mon devis"
        )}
      </button>
    </form>
  );
}
