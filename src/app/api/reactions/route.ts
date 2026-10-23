import { NextResponse } from "next/server";
import { bumpReaction, readReactions } from "@/lib/server-reactions";

/* Les identifiants acceptés sont les trois emojis de la barre,
   partagés par toute la galerie — rien d'autre n'écrit dans
   la base. */
const EMOJI_IDS = new Set(["heart", "rocket", "fire"]);

export async function GET() {
  const reactions = await readReactions();
  return NextResponse.json(reactions, {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let id = "";
  let dir: 1 | -1 = 1;
  try {
    const body = (await request.json()) as { id?: unknown; dir?: unknown };
    id = typeof body.id === "string" ? body.id : "";
    dir = body.dir === -1 ? -1 : 1;
  } catch {
    /* corps illisible : traité comme vide */
  }
  if (!EMOJI_IDS.has(id)) {
    return NextResponse.json({ error: "unknown reaction" }, { status: 400 });
  }
  try {
    const reactions = await bumpReaction(id, dir);
    return NextResponse.json(
      { id, count: reactions[id] ?? 0, reactions },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 503 });
  }
}
