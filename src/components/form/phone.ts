export function digitsToPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  let normalized = digits;
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (!normalized.startsWith("7")) normalized = `7${normalized}`;
  return `+${normalized.slice(0, 11)}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "").slice(0, 11);
  const rest = digits.slice(1);
  if (!rest) return "+7";
  if (rest.length <= 3) return `+7 ${rest}`;
  if (rest.length <= 6) return `+7 ${rest.slice(0, 3)} ${rest.slice(3)}`;
  if (rest.length <= 8) {
    return `+7 ${rest.slice(0, 3)} ${rest.slice(3, 6)}-${rest.slice(6)}`;
  }
  return `+7 ${rest.slice(0, 3)} ${rest.slice(3, 6)}-${rest.slice(6, 8)}-${rest.slice(8, 10)}`;
}
