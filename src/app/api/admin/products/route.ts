import { NextResponse } from "next/server";
import {
  StorageUnavailableError,
  isAdminRequest,
  readCatalog,
  sanitizeProduct,
  writeCatalog,
} from "@/lib/server-products";
import type { Product } from "@/lib/types";

export async function PUT(req: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Administration non configurée (ADMIN_PASSWORD manquant)." },
      { status: 503 },
    );
  }
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const list = (body as { products?: Product[] })?.products;
  if (!Array.isArray(list) || list.length > 100) {
    return NextResponse.json({ error: "Catalogue invalide." }, { status: 422 });
  }
  const clean = list.map((p, i) => sanitizeProduct(p, i));
  // Identifiants stables et uniques
  const seen = new Set<string>();
  for (const p of clean) {
    if (seen.has(p.id)) {
      return NextResponse.json(
        { error: `Identifiant dupliqué : ${p.id}` },
        { status: 422 },
      );
    }
    seen.add(p.id);
  }
  try {
    await writeCatalog(clean);
  } catch (e) {
    if (e instanceof StorageUnavailableError) {
      console.error("Catalogue non enregistré :", e.message);
      return NextResponse.json(
        { error: e.message },
        { status: 503 },
      );
    }
    console.error("Échec enregistrement catalogue :", e);
    return NextResponse.json(
      { error: "Échec de l'enregistrement du catalogue." },
      { status: 500 },
    );
  }
  return NextResponse.json(await readCatalog());
}
