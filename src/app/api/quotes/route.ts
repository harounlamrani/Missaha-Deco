import { NextResponse } from "next/server";
import { quoteNumberSafe, saveQuotePdf } from "@/lib/server-quotes";

/* Le PDF du devis arrive déjà construit (jsPDF côté client) :
   la route ne fait que le monter et rendre l'URL qui part
   dans le message WhatsApp.

   Un VRAI devis pdf pèse des kilo-octets ; un corps plus
   court n'a jamais créé de fichier et se refuse ici, au titre
   des 400, plutôt qu'en panne de stockage. */
const MIN_PDF_CHARS = 32;

function pdfBase64(body: unknown): string {
  const p = typeof body === "string" ? body : "";
  const marker = "base64,";
  const at = p.indexOf(marker);
  return (at >= 0 ? p.slice(at + marker.length) : p).replace(/\s/g, "");
}
export async function POST(request: Request) {
  let number = "";
  let pdf = "";
  try {
    const body = (await request.json()) as {
      number?: unknown;
      pdf?: unknown;
    };
    number = typeof body.number === "string" ? body.number : "";
    pdf = typeof body.pdf === "string" ? body.pdf : "";
  } catch {
    /* corps illisible : traité comme vide */
  }
  if (
    !quoteNumberSafe(number) ||
    !pdf.includes("application/pdf") ||
    pdfBase64(pdf).length < MIN_PDF_CHARS
  ) {
    return NextResponse.json({ error: "invalid quote" }, { status: 400 });
  }
  try {
    const url = await saveQuotePdf(number, pdf);
    return NextResponse.json({ url }, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 503 });
  }
}
