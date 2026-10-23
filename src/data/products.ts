import type { Product } from "@/lib/types";

/**
 * Catalogue par défaut (intégré au build).
 * L'Admin écrit dans data/products.json (lu en priorité via /api/products).
 * N'invente aucune caractéristique non confirmée : les champs vides restent vides.
 */
export const defaultProducts: Product[] = [
  {
    id: "meuble-mural-01",
    ref: "MSH-001",
    name: "Meuble mural de rangement décoratif",
    category: "Rangement mural",
    shortDescription:
      "Un design moderne et élégant pour un intérieur organisé.",
    description:
      "Meuble mural de rangement décoratif Missaha DECO : optimisez vos murs avec une pièce à la fois pratique et décorative. Idéal pour le salon, la chambre ou l'entrée.",
    price: 6000,
    images: [
      {
        src: "/images/meuble-mural-vue-murale.jpg",
        alt: "Meuble mural de rangement installé sur un mur — façade blanche, niches en bois clair",
      },
      {
        src: "/images/meuble-mural-frontal.jpg",
        alt: "Vue frontale du meuble mural — porte grise, tablettes en bois clair",
      },
    ],
    colors: [
      { name: "Blanc", hex: "#ffffff" },
      { name: "Bois clair", hex: "#d9b98f" },
    ],
    dimensions: "",
    material: "",
    installation: "",
    packaging: "",
    availability: "available",
    order: 1,
  },
];

export function getAvailableProducts(products: Product[]): Product[] {
  return [...products].sort((a, b) => a.order - b.order);
}

export function effectivePrice(p: Product): number {
  return p.promoPrice ?? p.price;
}
