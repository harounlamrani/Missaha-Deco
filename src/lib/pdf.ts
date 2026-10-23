import type { Quote } from "./types";
import { formatDA } from "./format";
import { SITE } from "./site";

/**
 * Génère un vrai PDF téléchargeable (jsPDF, import dynamique côté client).
 * Mise en page sobre, lisible sur téléphone et à l'impression.
 * Logo : image réelle /logo.jpg si accessible, sinon logotype texte.
 */
async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.jpg");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function downloadQuotePdf(q: Quote): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  let y = 18;
  const left = 16;
  const line = (step = 7) => (y += step);

  // En-tête — bande crème avec logo
  doc.setFillColor(255, 253, 248);
  doc.rect(0, 0, W, 30, "F");
  doc.setDrawColor(240, 233, 220);
  doc.line(0, 30, W, 30);

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "JPEG", 14, 4, 22, 22);
    doc.setTextColor(28, 25, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Missaha DECO", 40, 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${SITE.brandAr}  ·  ${SITE.category}`, 40, 19);
  } else {
    doc.setTextColor(28, 25, 23);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Missaha DECO", left, 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(SITE.category, left, 18);
  }

  doc.setTextColor(28, 25, 23);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("DEVIS", W - left, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`N° ${q.number}`, W - left, 17, { align: "right" });
  doc.text(
    new Date(q.date).toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    W - left,
    22,
    { align: "right" },
  );
  y = 40;

  doc.setTextColor(28, 25, 23);
  doc.setFontSize(11);

  // Client
  doc.setFont("helvetica", "bold");
  doc.text("Client", left, y);
  line();
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const t of [
    `Nom : ${q.customer.fullName}`,
    `Téléphone : ${q.customer.phone}`,
    `Wilaya : ${q.wilayaName}`,
    `Commune : ${q.customer.commune}`,
    `Adresse : ${q.customer.address}`,
  ]) {
    const wrapped = doc.splitTextToSize(t, W - left * 2);
    doc.text(wrapped, left, y);
    y += wrapped.length * 5;
  }
  line(3);

  // Produits
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Commande", left, y);
  line();
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  q.items.forEach((it, i) => {
    const head = `${i + 1}. ${it.name} (${it.ref})`;
    doc.setFont("helvetica", "bold");
    doc.text(doc.splitTextToSize(head, W - left * 2), left, y);
    y += doc.splitTextToSize(head, W - left * 2).length * 5;
    doc.setFont("helvetica", "normal");
    const detail =
      `Couleur : ${it.color} — Qté : ${it.quantity} — ` +
      `PU : ${formatDA(it.unitPrice)} — Sous-total : ${formatDA(it.unitPrice * it.quantity)}`;
    const wrapped = doc.splitTextToSize(detail, W - left * 2);
    doc.text(wrapped, left, y);
    y += wrapped.length * 5 + 2;
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
  });
  line(2);

  // Totaux
  doc.setFontSize(11);
  doc.text(`Sous-total produits : ${formatDA(q.subtotal)}`, left, y);
  line();
  doc.text(
    `Livraison (${q.deliveryMethod === "domicile" ? "domicile" : "bureau"}) : ${formatDA(q.deliveryPrice)}`,
    left,
    y,
  );
  line();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`Total à payer : ${formatDA(q.total)}`, left, y);
  line(4);
  doc.setFontSize(10);
  doc.text(SITE.paymentNote, left, y);

  doc.save(`devis-${q.number}.pdf`);
}
