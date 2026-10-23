import { NextResponse } from "next/server";
import { SHOTS } from "@/data/carousel";
import { bumpReaction, readReactions } from "@/lib/server-reactions";

/* Les identifiants acceptés sont les noms des images du carrousel :
   rien d'autre n'écrit dans data/reactions.json. */
const NAMES = new Set(SHOTS.map((s) => s.name));

export async function GET() {
  const reactions = await readReactions();
  return NextResponse.json(reactions, {
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request) {
  let id = "";
  try {
    const body = (await request.json()) as { id?: unknown };
    id = typeof body.id === "string" ? body.id : "";
  } catch {
    // corps illisible : traité comme vide
  }
  if (!NAMES.has(id)) {
    return NextResponse.json({ error: "unknown image" }, { status: 400 });
  }
  try {
    const reactions = await bumpReaction(id);
    return NextResponse.json(
      { id, count: reactions[id] ?? 1, reactions },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "save failed" }, { status: 503 });
  }
}
