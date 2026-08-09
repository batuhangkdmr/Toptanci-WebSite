/** Türkiye cep telefonu normalizasyonu (+90XXXXXXXXXX) */
export function normalizeTurkishPhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national = digits;

  if (national.startsWith("90") && national.length === 12) {
    national = national.slice(2);
  } else if (national.startsWith("0") && national.length === 11) {
    national = national.slice(1);
  }

  if (national.length !== 10) return null;
  if (!national.startsWith("5")) return null;

  return `+90${national}`;
}

export function isValidTurkishPhone(input: string): boolean {
  return normalizeTurkishPhone(input) !== null;
}
