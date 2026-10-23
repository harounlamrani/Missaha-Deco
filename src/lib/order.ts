import type {
  CustomerInfo,
  DeliveryMethod,
  OrderItem,
  Product,
  Quote,
  ValidatedOrder,
} from "./types";
import { effectivePrice } from "@/data/products";
import {
  calculateDeliveryPrice,
  getWilayaById,
} from "./delivery";

export interface RawOrderInput {
  items: Array<{ productId: string; color: string; quantity: number }>;
  customer: CustomerInfo;
  deliveryMethod: DeliveryMethod;
}

export interface ValidationResult {
  ok: boolean;
  errors: Record<string, string>;
  order?: ValidatedOrder;
}

function clean(str: string): string {
  return str.trim().replace(/\s+/g, " ");
}

/**
 * Recalcule TOUT à partir des données serveur/bundlées.
 * Ne fait jamais confiance aux totaux envoyés par le client.
 */
export function validateAndPriceOrder(
  input: RawOrderInput,
  catalog: Product[],
): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.items || input.items.length === 0) {
    errors.items = "Votre commande est vide.";
  }

  const items: OrderItem[] = [];
  for (const [i, raw] of (input.items ?? []).entries()) {
    const product = catalog.find((p) => p.id === raw.productId);
    if (!product) {
      errors[`items.${i}`] = "Produit inconnu.";
      continue;
    }
    if (product.availability !== "available") {
      errors[`items.${i}`] = `${product.name} n'est pas disponible pour le moment.`;
      continue;
    }
    const color = product.colors.find((c) => c.name === raw.color);
    if (!color) {
      errors[`items.${i}`] = "Couleur invalide pour ce produit.";
      continue;
    }
    const qty = Math.floor(Number(raw.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 99) {
      errors[`items.${i}`] = "Quantité invalide (1 à 99).";
      continue;
    }
    items.push({
      productId: product.id,
      ref: product.ref,
      name: product.name,
      image: product.images[0]?.src,
      dimensions: product.dimensions ?? "",
      color: color.name,
      unitPrice: effectivePrice(product),
      quantity: qty,
    });
  }

  const c = input.customer ?? ({} as CustomerInfo);
  const fullName = clean(c.fullName ?? "");
  if (fullName.length < 3) errors.fullName = "Indiquez votre nom complet.";
  const phone = (c.phone ?? "").replace(/[\s.\-()]/g, "");
  if (!/^(?:\+213|0)(5|6|7)\d{8}$/.test(phone))
    errors.phone = "Numéro algérien invalide (ex. 0562 07 35 08).";

  const wilaya = getWilayaById(Number(c.wilayaId));
  if (!wilaya) errors.wilayaId = "Sélectionnez votre wilaya.";
  const commune = clean(c.commune ?? "");
  if (commune.length < 2) errors.commune = "Indiquez votre commune.";
  const address = clean(c.address ?? "");
  if (address.length < 5) errors.address = "Indiquez votre adresse de livraison.";

  const method: DeliveryMethod =
    input.deliveryMethod === "domicile" ? "domicile" : "bureau";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const subtotal = items.reduce((s, it) => s + it.unitPrice * it.quantity, 0);
  const deliveryPrice = calculateDeliveryPrice(wilaya!.id, method);

  return {
    ok: true,
    errors: {},
    order: {
      items,
      customer: {
        fullName,
        phone,
        wilayaId: wilaya!.id,
        commune,
        address,
      },
      deliveryMethod: method,
      subtotal,
      deliveryPrice,
      total: subtotal + deliveryPrice,
      wilayaName: wilaya!.name,
    },
  };
}

/**
 * Numéro de devis unique : date + aléatoire cryptographique.
 * Pas basé uniquement sur l'heure du navigateur.
 */
export function createQuoteNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  const rand = (buf[0] % 46656).toString(36).toUpperCase().padStart(3, "0");
  const rand2 = Math.floor(crypto.getRandomValues(new Uint8Array(1))[0] / 16)
    .toString(36)
    .toUpperCase();
  return `MSH-${ymd}-${rand}${rand2}`;
}

export function createQuote(order: ValidatedOrder): Quote {
  return {
    ...order,
    number: createQuoteNumber(),
    date: new Date().toISOString(),
  };
}
