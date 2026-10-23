import { promises as fs } from "fs";
import path from "path";
import { createHash, timingSafeEqual } from "crypto";
import type { Product } from "@/lib/types";
import { defaultProducts } from "@/data/products";

const DATA_DIR = path.join(process.cwd(), "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");

export async function readCatalog(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Product[];
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // fichier absent ou illisible : repli sur le catalogue intégré
  }
  return defaultProducts;
}

/** Erreur claire quand l'hébergement ne permet pas la persistance (ex. Vercel serverless). */
export class StorageUnavailableError extends Error {
  readonly code = "STORAGE_UNAVAILABLE";
  constructor() {
    super(
      "Stockage temporaire indisponible : ce fichier est uniquement en lecture pour cet hébergement. Les modifications du catalogue ne peuvent pas être enregistrées ici.",
    );
  }
}

export async function writeCatalog(products: Product[]): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code ?? "";
    if (["EROFS", "EACCES", "EPERM"].includes(code)) {
      throw new StorageUnavailableError();
    }
    throw e;
  }
}

function adminHash(): Buffer | null {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) return null;
  return createHash("sha256").update(`missaha-admin:${pwd}`).digest();
}

export function isAdminRequest(req: Request): boolean {
  const expected = adminHash();
  if (!expected) return false;
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("ms_admin="))
    ?.slice("ms_admin=".length);
  if (!token) return false;
  try {
    const got = Buffer.from(token, "hex");
    return got.length === expected.length && timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

export function adminCookieValue(): string | null {
  const h = adminHash();
  return h ? h.toString("hex") : null;
}

/** Validation minimale d'un produit (l'Admin reste libre, mais typé). */
export function sanitizeProduct(p: Product, index: number): Product {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown, fb: number) =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fb;
  const id =
    str(p.id).trim() ||
    `p-${Date.now().toString(36)}-${index.toString(36)}`;
  return {
    id,
    ref: str(p.ref).trim() || `MSH-${String(index + 1).padStart(3, "0")}`,
    name: str(p.name).trim() || "Produit sans nom",
    category: str(p.category).trim() || "Rangement mural",
    shortDescription: str(p.shortDescription),
    description: str(p.description),
    price: num(p.price, 0),
    promoPrice:
      typeof p.promoPrice === "number" && p.promoPrice > 0
        ? p.promoPrice
        : undefined,
    images: Array.isArray(p.images)
      ? p.images
          .filter((i) => i && typeof i.src === "string" && i.src)
          .map((i) => ({ src: i.src, alt: str(i.alt) || str(p.name) }))
          .slice(0, 6)
      : [],
    colors: Array.isArray(p.colors)
      ? p.colors
          .filter((c) => c && typeof c.name === "string" && c.name.trim())
          .map((c) => ({ name: c.name.trim(), hex: str(c.hex) || "#cccccc" }))
      : [],
    dimensions: str(p.dimensions),
    material: str(p.material),
    installation: str(p.installation),
    packaging: str(p.packaging),
    installVideoUrl: str(p.installVideoUrl),
    availability:
      p.availability === "unavailable" || p.availability === "preorder"
        ? p.availability
        : "available",
    order: typeof p.order === "number" ? p.order : index,
  };
}
