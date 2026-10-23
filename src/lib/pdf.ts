import type { Quote } from "./types";
import { SITE } from "./site";
import type { jsPDF } from "jspdf";

/**
 * Le devis, habillé comme une pièce de marque.
 *
 * Le gabarit suit le modèle qui a servi d'exemple : en-tête
 * sur papier crème (logo à gauche, DEVIS et numéro à droite,
 * filet doré), bloc client à pictos, panneau en pointillés
 * qui montre chaque produit EN PHOTO, tableau
 * DÉSIGNATION / DÉTAILS / PRIX, ligne livraison, bandeau
 * total, bas de page remerciements.
 *
 * jsPDF côté client ; le même document sert au
 * téléchargement direct et au montage sur le serveur
 * (buildQuotePdf → downloadQuotePdf / quotePdfDataUrl).
 */

/* ── la palette du site, en hex pour jsPDF ──────────────────
   une seule source : @theme dans globals.css. Ce sont les
   mêmes couleurs copiées — changer la marque dans l'un sans
   l'autre voudrait dire deux marques. */
const INK = "#1c1917";
const INK_SOFT = "#57534e";
const LINE = "#f0e9dc";
const PAPER = "#fffdf8";
const YELLOW = "#ffb703";
const YELLOW_SOFT = "#fff7e0";
const ORANGE_DEEP = "#b45309";
const WHITE = "#ffffff";

/* ── les formats ─────────────────────────────────────────────
   L'Intl fr-DZ joint les milliers par un ESPACE FINE
   (U+202F) qui n'existe pas dans les polices standardes du
   PDF : le chiffre se rendait « 6/000 ». Les montants du
   devis passent par leur propre format — espace ordinaire.
   L'arabe est écarté pour la même raison : jsPDF n'écrit pas
   de droite à gauche, l'alphabet s'en voyait inversé. */
const pdfDA = (amount: number) =>
  `${amount.toLocaleString("fr-FR").replace(/[\u00a0\u202f]/g, " ")} DA`;

const pdfPhone = (phone: string): string => {
  const clean = phone.replace(/[\s.\-()]/g, "");
  const local = clean.startsWith("+213") ? `0${clean.slice(4)}` : clean;
  return local.replace(/^(\d{4})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4");
};

/* Une photo, décodée une fois : data-URL jpeg pour jsPDF,
   plus ratio naturel pour la mise à l'échelle. Le détour
   par un canvas est là pour le webp — jsPDF ne le décode
   pas, un canvas si. */
async function loadPhoto(
  src: string,
): Promise<{ data: string; ratio: number } | null> {
  try {
    const res = await fetch(src);
    if (!res.ok) return null;
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const ratio = bitmap.width / Math.max(1, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, bitmap.width);
    canvas.height = Math.max(1, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close?.();
      return null;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close?.();
    return { data: canvas.toDataURL("image/jpeg", 0.88), ratio };
  } catch {
    /* image distante refusée par CORS ou introuvable : la
       case photo reste vide et la pièce garde sa valeur */
    return null;
  }
}

/* la photo CONTENUE, bornée à maxW de large ; centrée dans
   la case pleine — un cover couperait le meuble, un contain
   passé 190mm le rendrait minuscule dans une case trop
   large. */
function placeContained(
  doc: jsPDF,
  data: string,
  ratio: number,
  fullX: number,
  fullY: number,
  fullW: number,
  fullH: number,
  maxW = fullW,
) {
  let ih = fullH;
  let iw = ih * ratio;
  if (iw > maxW) {
    iw = maxW;
    ih = iw / ratio;
  }
  doc.addImage(data, "JPEG", fullX + (fullW - iw) / 2, fullY, iw, ih);
}

/* ── les pictos du bloc client ──────────────────────────────
   dessinés en vectoriel à l'orange profond, comme sur le
   modèle : personne, combiné, épingle — et un camion pour la
   livraison. Aucun actif à charger, aucune licence à lire. */
function iconPerson(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(ORANGE_DEEP);
  doc.circle(x + 2.6, y + 1.6, 1.5, "F");
  /* les épaules : un disque dont la moitié basse est
     recouverte par le papier, faute d'arc à jsPDF */
  doc.circle(x + 2.6, y + 6.9, 2.7, "F");
  doc.setFillColor(PAPER);
  doc.rect(x - 0.8, y + 4.4, 6.8, 3.4, "F");
}
function iconPhone(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(ORANGE_DEEP);
  doc.roundedRect(x + 0.9, y - 0.4, 3.4, 6.4, 1.1, 1.1, "F");
  doc.setFillColor(WHITE);
  doc.circle(x + 2.6, y + 4.9, 0.65, "F");
}
function iconPin(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(ORANGE_DEEP);
  doc.circle(x + 2.6, y + 2.1, 2.1, "F");
  doc.triangle(x + 1.2, y + 3.6, x + 4, y + 3.6, x + 2.6, y + 6.6, "F");
  doc.setFillColor(WHITE);
  doc.circle(x + 2.6, y + 2.1, 0.85, "F");
}
function iconTruck(doc: jsPDF, x: number, y: number) {
  doc.setFillColor(ORANGE_DEEP);
  doc.roundedRect(x, y + 1, 5.4, 3.2, 0.8, 0.8, "F");
  doc.roundedRect(x + 5.2, y + 2.2, 2, 2, 0.5, 0.5, "F");
  doc.circle(x + 1.9, y + 5.1, 0.8, "F");
  doc.circle(x + 6.2, y + 5.1, 0.8, "F");
}

/* une ligne du bloc client : picto, libellé en capitales
   dorées, valeur(s) encre ; rend y pour la suivante */
function clientRow(
  doc: jsPDF,
  icon: (d: jsPDF, x: number, y: number) => void,
  label: string,
  values: string[],
  x: number,
  y: number,
): number {
  icon(doc, x, y - 2.6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(ORANGE_DEEP);
  doc.setFontSize(9);
  doc.text(label.toUpperCase(), x + 10, y + 0.6, { charSpace: 0.35 });
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  doc.setFontSize(11);
  values.forEach((line, i) => {
    doc.text(line, x + 40, y + 0.6 + i * 5.4);
  });
  return y + 6.5 + values.length * 5.4;
}

/* une borne de photo par item : la géométrie d'abord, les
   images ensuite — chaque addImage coûte un décodage, il se
   fait une fois les boîtes posées */
type PhotoSlot = {
  page: number;
  box: [number, number, number, number];
  src: string;
};

type PanelSegment = { page: number; top: number; bottom: number };

async function buildQuotePdf(q: Quote): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const LEFT = 16;
  const RIGHT = 194;
  const MID = W / 2;
  let y = 0;
  const pageOf = () => doc.getCurrentPageInfo().pageNumber;

  /* ── l'en-tête, sur le papier crème ──────────────────────── */
  doc.setFillColor(PAPER);
  doc.rect(0, 0, W, 34, "F");
  doc.setDrawColor(LINE);
  doc.setLineWidth(0.5);
  doc.line(0, 34, W, 34);

  const logo = await loadPhoto("/logo.jpg");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  if (logo) {
    doc.addImage(logo.data, "JPEG", LEFT, 5, 20, 20);
    doc.setFontSize(15);
    doc.text("Missaha DECO", LEFT + 26, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(INK_SOFT);
    doc.text(SITE.category, LEFT + 26, 18);
    doc.text(`Tél : ${pdfPhone(SITE.whatsappIntl)}`, LEFT + 26, 24);
  } else {
    doc.setFontSize(15);
    doc.text("Missaha DECO", LEFT, 12);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(INK_SOFT);
    doc.text(SITE.category, LEFT, 18);
    doc.text(`Tél : ${pdfPhone(SITE.whatsappIntl)}`, LEFT, 24);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(INK);
  doc.text("DEVIS", RIGHT, 10, { align: "right" });
  doc.setFontSize(16);
  doc.setTextColor(ORANGE_DEEP);
  doc.text(q.number, RIGHT, 16.5, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(INK_SOFT);
  doc.text(
    new Date(q.date).toLocaleDateString("fr-DZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }),
    RIGHT,
    22,
    { align: "right" },
  );
  y = 36;

  /* ── le client ───────────────────────────────────────────── */
  y = clientRow(doc, iconPerson, "Client", [q.customer.fullName], LEFT, y);
  y = clientRow(doc, iconPhone, "Numéro", [pdfPhone(q.customer.phone)], LEFT, y);
  const address = `${q.customer.address}, ${q.customer.commune} — ${q.wilayaName}`;
  const addressWrap = doc.splitTextToSize(address, RIGHT - LEFT - 40);
  y = clientRow(doc, iconPin, "Adresse", addressWrap, LEFT, y);

  /* le filet doré et court que porte le modèle */
  doc.setDrawColor(YELLOW);
  doc.setLineWidth(0.8);
  doc.line(LEFT, y + 0.5, LEFT + 14, y + 0.5);
  y += 5;

  /* ── le panneau des photos ─────────────────────────────────
     Chaque produit prend une CARTE à deux colonnes, la même
     tenue que le modèle : la photo à gauche dans sa case
     carrée — une photo portrait y tient à sa vraie hauteur,
     une paysage traverse — et à droite le nom, les
     dimensions du catalogue, la couleur. Le cadre pointillé
     est posé PAR PAGE occupée — un cadre unique d'une page
     de plus tirerait jusqu'à la suivante. */
  const slots: PhotoSlot[] = [];
  const segments: PanelSegment[] = [];
  let page = pageOf();
  let seg: PanelSegment = { page, top: y, bottom: y };

  y += 5;
  for (const it of q.items) {
    const chipH = 6;
    const dims = (it.dimensions || "").trim();
    const photoW = 62;
    const photoH = 50;
    const cardH = chipH + 3.5 + photoH + 7;
    if (y + cardH > 278) {
      /* la page est pleine : le segment courant se ferme là,
         AVANT d'ouvrir la page neuve — sinon ses bornes
         suivraient y de la page 2 */
      seg.bottom = y - 3;
      segments.push(seg);
      doc.addPage();
      y = 20;
      page = pageOf();
      seg = { page, top: y, bottom: y };
    }
    y += 4;

    /* pastille nom — la police est réglée AVANT la mesure */
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const label = it.name.length > 26 ? `${it.name.slice(0, 25)}…` : it.name;
    const chipW = doc.getTextWidth(label) + 8;
    doc.setFillColor(ORANGE_DEEP);
    doc.roundedRect(LEFT, y, chipW, chipH, chipH / 2, chipH / 2, "F");
    doc.setTextColor(WHITE);
    doc.text(label, LEFT + chipW / 2, y + chipH - 1.8, { align: "center" });

    if (it.quantity > 1) {
      doc.setTextColor(ORANGE_DEEP);
      doc.text(`× ${it.quantity}`, RIGHT, y + chipH - 1.8, { align: "right" });
    }

    /* la photo à gauche, dans sa vraie case — crème bordée */
    const photoTop = y + chipH + 3.5;
    doc.setFillColor(PAPER);
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.4);
    doc.roundedRect(LEFT, photoTop, photoW, photoH, 4, 4, "FD");
    if (it.image) {
      slots.push({
        page,
        box: [LEFT + 3, photoTop + 2, photoW - 6, photoH - 4],
        src: it.image,
      });
    } else {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(INK_SOFT);
      doc.setFontSize(8.5);
      doc.text("Vue du produit", LEFT + photoW / 2, photoTop + photoH / 2, {
        align: "center",
      });
    }

    /* à droite de la photo : dimensions, puis couleur et réf */
    const tx = LEFT + photoW + 7;
    let ty = photoTop + 5.5;
    doc.setFont("helvetica", "normal");
    if (dims) {
      doc.setFontSize(11);
      doc.setTextColor(INK);
      doc.text(doc.splitTextToSize(dims, RIGHT - tx), tx, ty);
    }
    doc.setFontSize(10);
    doc.setTextColor(INK);
    ty += dims ? 7.5 : 0;
    doc.text(`Couleur : ${it.color}`, tx, ty);
    ty += 5.4;
    doc.setTextColor(INK_SOFT);
    doc.setFontSize(9);
    doc.text(`Réf. ${it.ref}`, tx, ty);

    y = photoTop + photoH + 7;
    seg.bottom = y - 2;
  }
  segments.push(seg);

  /* le cadre pointillé, un tracé par segment de page */
  doc.setDrawColor(ORANGE_DEEP);
  doc.setLineWidth(0.5);
  doc.setLineDashPattern([1.8, 1.4], 0);
  for (const s of segments) {
    if (s.bottom - s.top > 6) {
      doc.setPage(s.page);
      doc.roundedRect(LEFT - 3, s.top, RIGHT - LEFT + 6, s.bottom - s.top, 5, 5, "S");
    }
  }
  doc.setLineDashPattern([], 0);

  /* les photos, posées une fois la géométrie stable */
  for (const slot of slots) {
    const photo = await loadPhoto(slot.src);
    if (!photo) continue;
    doc.setPage(slot.page);
    placeContained(doc, photo.data, photo.ratio, ...slot.box);
  }
  doc.setPage(segments[segments.length - 1].page);
  y = segments[segments.length - 1].bottom;

  /* ── le tableau ────────────────────────────────────────────
     Une ligne du tableau mesure CE QUE LE TEXTE occupe :
     nom et détails sont mesurés, l'épaisseur de la rangée
     suit, et la séparation ne mord plus sur la suivante. */
  const tableHead = (yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.setFontSize(9.5);
    doc.text("DÉSIGNATION", LEFT, yy, { charSpace: 0.35 });
    doc.text("DÉTAILS", 80, yy, { charSpace: 0.35 });
    doc.text("PRIX", RIGHT, yy, { align: "right", charSpace: 0.35 });
    doc.setDrawColor(INK);
    doc.setLineWidth(0.5);
    doc.line(LEFT - 2, yy + 3, RIGHT + 2, yy + 3);
  };
  y += 10;
  if (y > 258) {
    doc.addPage();
    y = 22;
  }
  tableHead(y);
  y += 10;
  for (const it of q.items) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const nameCell = it.quantity > 1 ? `${it.name} (× ${it.quantity})` : it.name;
    const nameLines = doc.splitTextToSize(nameCell, 60);
    const detail = [it.color, (it.dimensions || "").trim()]
      .filter(Boolean)
      .join(" — ");
    doc.setFontSize(10);
    doc.setTextColor(INK_SOFT);
    const detailLines = doc.splitTextToSize(detail || "—", 88);
    const rowH = Math.max(9.5, 4.6 * nameLines.length + 2, 4.6 * detailLines.length + 2);
    if (y + rowH > 272) {
      doc.addPage();
      y = 22;
      tableHead(y);
      y += 10;
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(INK);
    doc.text(nameLines, LEFT, y + 4.4);
    doc.setFontSize(10);
    doc.setTextColor(INK_SOFT);
    doc.text(detailLines, 80, y + 4.4);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(INK);
    doc.text(pdfDA(it.unitPrice * it.quantity), RIGHT, y + 4.4, {
      align: "right",
    });
    doc.setDrawColor(LINE);
    doc.setLineWidth(0.4);
    doc.line(LEFT - 2, y + rowH - 1.1, RIGHT + 2, y + rowH - 1.1);
    y += rowH;
  }

  /* la livraison, à la suite, façon ligne du modèle */
  const deliveryRow = (yy: number) => {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(INK);
    doc.setFontSize(10.5);
    iconTruck(doc, LEFT + 1, yy - 1);
    doc.text(
      `Livraison ${q.deliveryMethod === "domicile" ? "à domicile" : "au bureau"} — ${q.wilayaName}`,
      LEFT + 11,
      yy + 4.4,
    );
    doc.setFont("helvetica", "bold");
    doc.text(pdfDA(q.deliveryPrice), RIGHT, yy + 4.4, { align: "right" });
  };
  if (y > 266) {
    doc.addPage();
    y = 22;
  }
  deliveryRow(y);
  y += 10;

  /* ── le total, en bandeau jaune doux ──────────────────────── */
  if (y > 276) {
    doc.addPage();
    y = 24;
  }
  doc.setFillColor(YELLOW_SOFT);
  doc.setDrawColor(YELLOW);
  doc.setLineWidth(0.6);
  doc.roundedRect(LEFT - 2, y, RIGHT - LEFT + 4, 15, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setTextColor(INK);
  doc.setFontSize(12.5);
  doc.text("Total avec livraison", LEFT + 2.5, y + 9.7);
  doc.setFontSize(19);
  doc.setTextColor(ORANGE_DEEP);
  doc.text(pdfDA(q.total), RIGHT - 2.5, y + 10.2, { align: "right" });
  y += 20;

  /* ── le bas de page ──────────────────────────────────────── */
  const foot = "MERCI DE VOTRE CONFIANCE — MISSAHA DECO";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(INK_SOFT);
  const footW = doc.getTextWidth(foot);
  const footX = MID - footW / 2;
  doc.setDrawColor(ORANGE_DEEP);
  doc.setLineWidth(0.8);
  doc.line(footX - 9, y + 2.4, footX - 3, y + 2.4);
  doc.line(footX + footW + 3, y + 2.4, footX + footW + 9, y + 2.4);
  doc.text(foot, MID, y + 3, { align: "center" });
  doc.setFontSize(7.5);
  doc.text("Missaha DECO · Alger, Algérie", MID, y + 8, { align: "center" });

  return doc;
}

/** Le même document, rendu en data-URL (application/pdf) */
export async function quotePdfDataUrl(q: Quote): Promise<string> {
  const doc = await buildQuotePdf(q);
  return doc.output("dataurlstring") as string;
}

/** Le téléchargement direct, inchangé pour le client */
export async function downloadQuotePdf(q: Quote): Promise<void> {
  const doc = await buildQuotePdf(q);
  doc.save(`devis-${q.number}.pdf`);
}
