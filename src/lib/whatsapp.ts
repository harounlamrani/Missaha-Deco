import type { Quote } from "./types";
import { formatDA } from "./format";
import { SITE, waLink } from "./site";

export function buildWhatsAppMessage(q: Quote): string {
  const lines: string[] = [];
  lines.push(`Bonjour ${SITE.brandDisplay}, je souhaite confirmer ma commande.`);
  lines.push("");
  lines.push(`Numéro du devis : ${q.number}`);
  lines.push("");
  q.items.forEach((it, i) => {
    lines.push(
      `Produit ${i + 1} : ${it.name} (${it.ref}) — ${formatDA(it.unitPrice)} x ${it.quantity}`,
    );
    lines.push(`Couleur : ${it.color}`);
  });
  lines.push(`Wilaya : ${q.wilayaName}`);
  lines.push(`Commune : ${q.customer.commune}`);
  lines.push(`Adresse : ${q.customer.address}`);
  lines.push(`Nom : ${q.customer.fullName} — Tél : ${q.customer.phone}`);
  lines.push("");
  lines.push(`Total produits : ${formatDA(q.subtotal)}`);
  lines.push(
    `Livraison (${q.deliveryMethod === "domicile" ? "domicile" : "bureau"}) : ${formatDA(q.deliveryPrice)}`,
  );
  lines.push(`Total à payer à la livraison : ${formatDA(q.total)}`);
  lines.push("");
  lines.push("Merci de confirmer la prise en charge de ma commande.");
  return lines.join("\n");
}

export function buildWhatsAppLink(q: Quote): string {
  return waLink(buildWhatsAppMessage(q));
}
