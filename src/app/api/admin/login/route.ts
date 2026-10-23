import { NextResponse } from "next/server";
import { adminCookieValue } from "@/lib/server-products";

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Administration non configurée (ADMIN_PASSWORD manquant)." },
      { status: 503 },
    );
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }
  const password = (body as { password?: string })?.password ?? "";
  if (password !== expected) {
    return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ms_admin", adminCookieValue()!, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ms_admin", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
