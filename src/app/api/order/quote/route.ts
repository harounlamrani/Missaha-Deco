import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readCatalog } from "@/lib/server-products";
import { validateAndPriceOrder } from "@/lib/order";
import type { Quote } from "@/lib/types";

/**
 * Le devis est calculé côté serveur à partir du catalogue serveur :
 * les totaux envoyés par le client sont ignorés.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const catalog = await readCatalog();
  const { items, customer, deliveryMethod } = (body ?? {}) as {
    items?: Array<{ productId: string; color: string; quantity: number }>;
    customer?: Quote["customer"];
    deliveryMethod?: Quote["deliveryMethod"];
  };
  const result = validateAndPriceOrder(
    { items: items ?? [], customer: customer!, deliveryMethod: deliveryMethod! },
    catalog,
  );
  if (!result.ok || !result.order) {
    return NextResponse.json({ errors: result.errors }, { status: 422 });
  }
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate(),
  ).padStart(2, "0")}`;
  const rand = randomUUID().replace(/-/g, "").slice(0, 5).toUpperCase();
  const quote: Quote = {
    ...result.order,
    number: `MSH-${ymd}-${rand}`,
    date: d.toISOString(),
  };
  return NextResponse.json(quote);
}
