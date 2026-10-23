import { readQuotePdf } from "@/lib/server-quotes";

/* Le devis monté, servi tel quel : le client ouvre l'URL
   depuis WhatsApp et lit le document, sans téléchargement
   ni jointure. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;
  const pdf = await readQuotePdf(number);
  if (!pdf) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="devis-${number}.pdf"`,
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}
