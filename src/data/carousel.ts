/* ── les images de la carrousel ────────────────────────────
   La source unique de la liste : le Carousel la dessine et la
   barre de réactions la compte. Elle vit ici, hors de tout
   composant, parce qu'une route serveur la lit aussi —
   importer le fichier du Carousel depuis une route, c'est
   attraper ses hooks dans un module serveur et le build le
   refuse.

   Les noms servent d'identifiants aux compteurs de réactions
   (clés de data/reactions.json), pas seulement de légendes :
   renommer un fichier déplace son compteur avec lui, ce qui
   est honnête — le compteur appartient à l'image, pas à sa
   position dans la liste. */
export const SHOTS: { name: string; src: string }[] = [
  { name: "1", src: "/images/carousel/1.webp" },
  { name: "2", src: "/images/carousel/2.webp" },
  { name: "3", src: "/images/carousel/3.webp" },
  { name: "4", src: "/images/carousel/4.webp" },
];
