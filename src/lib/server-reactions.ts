import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

/* ── les compteurs de réactions ─────────────────────────────
   Deux rangements, un seul contrat :

   - sur Vercel (production), le système de fichiers est en
     lecture seule : les compteurs vivent dans Postgres
     (Neon). La variable de connexion peut porter plusieurs
     noms selon le préfixe retenu au branchement de
     l'intégration — DATABASE_URL est le défaut de Neon,
     POSTGRES_URL le classique de Vercel, STORAGE_URL celui
     proposé sur l'écran de branchement.
   - sur un poste de développement (npm run dev), où aucune
     variable n'existe, chaque écriture passe par
     data/reactions.json — le rangement historique, qui reste
     la vérité quand la base n'est pas branchée.

   Dans les deux cas le contrat est le même : lire tous les
   compteurs, en monter un de un, et rendre la table complète
   après l'écriture — la réponse du POST est le fait du
   serveur, jamais l'optimisme du client. */

const connectionUrl =
  process.env.STORAGE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  null;

const sql = connectionUrl ? neon(connectionUrl) : null;

const DATA_DIR = path.join(process.cwd(), "data");
const REACTIONS_FILE = path.join(DATA_DIR, "reactions.json");

export type ReactionCounts = Record<string, number>;

/* la table est créée à la première écriture, jamais à chaque
   requête : un CREATE IF NOT EXISTS par pageload coûterait un
   aller-retour pour rien */
let tableReady = false;

/* le driver NeON ne peut être appelé qu'en gabarit, et ses
   lignes reviennent sans type : chaque SELECT en fait ses
   colonnes ici, une fois */
const asCounts = (rows: Record<string, unknown>[]) =>
  Object.fromEntries(
    rows
      .map((r) => [String(r.image), Math.max(0, Number(r.count))])
      .filter(([, v]) => Number.isFinite(v) && (v as number) >= 0),
  ) as ReactionCounts;

/* ── lire ──────────────────────────────────────────────────
   La base d'abord ; si elle est injoignable (startup de Neon
   à froid, réseau), le fichier garde sa place — et sans
   fichier du tout, la table vide. */
export async function readReactions(): Promise<ReactionCounts> {
  if (sql) {
    try {
      const rows =
        (await sql`SELECT image, count FROM reactions`) as Record<
          string,
          unknown
        >[];
      return asCounts(rows);
    } catch {
      /* retombée sous, sur le fichier */
    }
  }
  try {
    const raw = await fs.readFile(REACTIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ReactionCounts;
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([k, v]) => typeof k === "string" && typeof v === "number" && v >= 0,
      ),
    );
  } catch {
    /* fichier absent ou illisible : aucun compteur encore */
    return {};
  }
}

export async function bumpReaction(id: string): Promise<ReactionCounts> {
  if (sql) {
    if (!tableReady) {
      await sql`CREATE TABLE IF NOT EXISTS reactions (image TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0)`;
      tableReady = true;
    }
    /* l'upsert rapporte le seul compteur qui bouge : la
       lecture complète d'après donne le tableau entier, de
       quoi répondre au POST avec le fait du serveur */
    await sql`INSERT INTO reactions (image, count) VALUES (${id}, 1) ON CONFLICT (image) DO UPDATE SET count = reactions.count + 1`;
    const rows =
      (await sql`SELECT image, count FROM reactions`) as Record<
        string,
        unknown
      >[];
    return asCounts(rows);
  }
  const counts = await readReactions();
  counts[id] = (counts[id] ?? 0) + 1;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REACTIONS_FILE, JSON.stringify(counts, null, 2), "utf-8");
  return counts;
}
