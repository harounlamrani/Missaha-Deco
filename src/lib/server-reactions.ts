import { promises as fs } from "fs";
import path from "path";
import { neon } from "@neondatabase/serverless";

/* ── les compteurs de réactions ─────────────────────────────
   Un compteur par ÉMOJI, pas par photo : la galerie entière
   partage ses trois TOTALS (cœur, fusée, feu), que la barre
   affiche sous la carrousel. Les clés sont les identifiants
   des emojis ("heart", "rocket", "fire"), tenus d'un côté par
   route.ts, de l'autre par la barre.

   Deux rangements, un seul contrat :

   - sur Vercel (production), le système de fichiers est en
     lecture seule : les compteurs vivent dans Postgres
     (Neon). La variable de connexion peut porter plusieurs
     noms selon le préfixe retenu au branchement de
     l'intégration — DATABASE_URL est le défaut de Neon,
     POSTGRES_URL le classique de Vercel, STORAGE_URL celui
     proposé sur l'écran de branchement.
   - sur un poste de développement (npm run dev), aucune
     variable n'existe : chaque écriture passe par
     data/reactions.json.

   Dans les deux cas le contrat est le même : lire tous les
   compteurs, appliquer un ±1 demandé, et rendre la table
   complète après l'écriture — la réponse du POST est le fait
   du serveur, jamais l'optimisme du client. */

const connectionUrl =
  process.env.STORAGE_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL ??
  null;

const sql = connectionUrl ? neon(connectionUrl) : null;

const DATA_DIR = path.join(process.cwd(), "data");
const REACTIONS_FILE = path.join(DATA_DIR, "reactions.json");

export type ReactionCounts = Record<string, number>;

/* la table est prête à la première écriture, jamais à chaque
   requête : un DDL par pageload coûterait un aller-retour
   pour rien */
let tableReady = false;

/* la colonne s'appelle KEY; la première version de la table
   (des compteurs par image) la nommait IMAGE — renommée une
   fois ici, les données d'alors étant des pages d'essai */
async function ensureTable() {
  if (!sql || tableReady) return;
  try {
    await sql`ALTER TABLE reactions RENAME COLUMN image TO key`;
  } catch {
    /* pas de colonne image : table neuve, ou déjà renommée */
  }
  await sql`CREATE TABLE IF NOT EXISTS reactions (key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0)`;
  tableReady = true;
}

/* le driver Neon ne s'appelle qu'en gabarit et rend des
   lignes sans type : chaque SELECT passe sous la forme
   voulue ici, une fois */
const asCounts = (rows: Record<string, unknown>[]) =>
  Object.fromEntries(
    rows
      .map((r) => [String(r.key), Math.max(0, Math.trunc(Number(r.count)))])
      .filter(([, v]) => Number.isFinite(v) && (v as number) >= 0),
  ) as ReactionCounts;

/* ── lire ──────────────────────────────────────────────────
   La base d'abord ; si elle est injoignable (mise en route à
   froid de Neon, réseau), le fichier garde sa place — et
   sans fichier du tout, la table vide. */
export async function readReactions(): Promise<ReactionCounts> {
  if (sql) {
    try {
      await ensureTable();
      const rows =
        (await sql`SELECT key, count FROM reactions`) as Record<
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

/* dir vaut +1 (réagir) ou -1 (retirer sa réaction) : le
   serveur borne le compteur à zéro, peu importe ce que
   demande le client */
export async function bumpReaction(
  id: string,
  dir: 1 | -1,
): Promise<ReactionCounts> {
  if (sql) {
    await ensureTable();
    await sql`INSERT INTO reactions (key, count) VALUES (${id}, 1) ON CONFLICT (key) DO UPDATE SET count = GREATEST(reactions.count + ${dir}, 0)`;
    const rows =
      (await sql`SELECT key, count FROM reactions`) as Record<
        string,
        unknown
      >[];
    return asCounts(rows);
  }
  const counts = await readReactions();
  counts[id] = Math.max(0, (counts[id] ?? 0) + dir);
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REACTIONS_FILE, JSON.stringify(counts, null, 2), "utf-8");
  return counts;
}
