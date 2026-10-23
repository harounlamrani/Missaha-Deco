export function formatDA(amount: number): string {
  return `${new Intl.NumberFormat("fr-DZ").format(amount)} DA`;
}

/** Téléphone algérien : 05/06/07 + 8 chiffres, préfixe +213 accepté. */
export function isValidDzPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  return /^(?:\+213|0)(5|6|7)\d{8}$/.test(cleaned);
}

export function normalizeDzPhone(phone: string): string {
  return phone.replace(/[\s.\-()]/g, "");
}
