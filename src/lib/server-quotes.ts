import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

/* ── les devis montés, et l'URL qui va avec ──────────────────
   Le PDF naît dans le navigateur du client (jsPDF, pdf.ts).
   Il est monté ICI — une ligne de base — pour que le message
   WhatsApp porte une URL ouvrable dans la conversation :
   le client lit son devis sans trombone, et la jointure
   manuelle disparaît du parcours.

   Deux rangements, un seul contrat (voir server-reactions) :
   Neon/Postgres quand la variable de l'intégration existe
   (Vercel, production), fichier dans data/quotes/ sur un
   poste de développement. */

const connectionUrl =
  process.env.STORAGE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  null;

const sql = connectionUrl ? neon(connectionUrl) : null;

const QUOTES_DIR = path.join(process.cwd(), "data", "quotes");

/* la table est prête à la première écriture — les devis
   anciens ne sont jamais réécrits, un devis est un document
   figé, pas une valeur qui monte */
let tableReady = false;

async function ensureTable() {
  if (!sql || tableReady) return;
  await sql`CREATE TABLE IF NOT EXISTS quotes (number TEXT PRIMARY KEY, pdf TEXT NOT NULL, created TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
  tableReady = true;
}

const SAFE = /^[A-Za-z0-9._-]+$/;

export function quoteNumberSafe(number: string): boolean {
  return SAFE.test(number);
}

/** garde le PDF du devis ; rend l'URL publique relative */
export async function saveQuotePdf(number: string, dataUrl: string) {
  const marker = "base64,";
  const at = dataUrl.indexOf(marker);
  const base64 = at >= 0 ? dataUrl.slice(at + marker.length) : dataUrl;
  if (sql) {
    await ensureTable();
    await sql`INSERT INTO quotes (number, pdf) VALUES (${number}, ${base64}) ON CONFLICT (number) DO UPDATE SET pdf = EXCLUDED.pdf`;
    return `/api/quotes/${number}`;
  }
  await fs.mkdir(QUOTES_DIR, { recursive: true });
  await fs.writeFile(
    path.join(QUOTES_DIR, `${number}.pdf`),
    Buffer.from(base64, "base64"),
  );
  return `/api/quotes/${number}`;
}

export async function readQuotePdf(number: string): Promise<Buffer | null> {
  if (!quoteNumberSafe(number)) return null;
  if (sql) {
    try {
      await ensureTable();
      const rows = (await sql`SELECT pdf FROM quotes WHERE number = ${number} LIMIT 1`) as Record<
        string,
        unknown
      >[];
      const pdf = rows[0]?.pdf;
      return typeof pdf === "string" ? Buffer.from(pdf, "base64") : null;
    } catch {
      /* base lointaine : retombée sur le fichier */
    }
  }
  try {
    return await fs.readFile(path.join(QUOTES_DIR, `${number}.pdf`));
  } catch {
    return null;
  }
}
