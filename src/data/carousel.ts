/* ── les images de la carrousel ────────────────────────────
   La source unique de la liste : le Carousel la dessine. Elle
   vit ici, hors de tout composant, pour rester lisible par un
   module serveur si un jour un de ses modules la reprend —
   importer le fichier du Carousel depuis une route, c'est
   attraper ses hooks dans un module serveur et le build le
   refuse. */
export const SHOTS: { name: string; src: string }[] = [
  { name: "1", src: "/images/carousel/1.webp" },
  { name: "2", src: "/images/carousel/2.webp" },
  { name: "3", src: "/images/carousel/3.webp" },
  { name: "4", src: "/images/carousel/4.webp" },
];
