export const SITE = {
  brand: "missaha",
  brandDisplay: "Missaha DECO",
  brandAr: "مساحة",
  category: "Rangement mural décoratif",
  currency: "DA",
  paymentNote: "Paiement à la livraison",
  // Fourni par le client : 0562073508 -> international
  whatsappIntl: "213562073508",
  whatsappDisplay: "0562 07 35 08",
  // Compte Instagram officiel confirmé ; Facebook à confirmer
  instagramUrl: "https://www.instagram.com/missaha.deco",
  facebookUrl: "https://facebook.com/",
  carrierLabel: "Yalidine",
} as const;

export function waLink(message: string): string {
  return `https://wa.me/${SITE.whatsappIntl}?text=${encodeURIComponent(message)}`;
}
