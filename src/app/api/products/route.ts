import { NextResponse } from "next/server";
import { readCatalog } from "@/lib/server-products";

export async function GET() {
  const products = await readCatalog();
  return NextResponse.json(products);
}
