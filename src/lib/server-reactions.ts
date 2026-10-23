import { promises as fs } from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const REACTIONS_FILE = path.join(DATA_DIR, "reactions.json");

export type ReactionCounts = Record<string, number>;

export async function readReactions(): Promise<ReactionCounts> {
  try {
    const raw = await fs.readFile(REACTIONS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as ReactionCounts;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).filter(
          ([k, v]) => typeof k === "string" && typeof v === "number" && v >= 0,
        ),
      );
    }
  } catch {
    // fichier absent ou illisible : aucun compteur encore
  }
  return {};
}

export async function bumpReaction(id: string): Promise<ReactionCounts> {
  const counts = await readReactions();
  counts[id] = (counts[id] ?? 0) + 1;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(REACTIONS_FILE, JSON.stringify(counts, null, 2), "utf-8");
  return counts;
}
