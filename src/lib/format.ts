import type { Locale, Localized, PaymentProvider } from "@/types";

/** RWF has no sub-units in practice: always whole numbers, comma-grouped. */
export function formatRWF(amount: number): string {
  const n = Math.round(amount);
  const grouped = Math.abs(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${n < 0 ? "−" : ""}RWF ${grouped}`;
}

export function formatRange(min: number, max: number): string {
  return `${formatRWF(min)} – ${formatRWF(max).replace("RWF ", "")}`;
}

/** Resolve localized content with English fallback (mirrors API behaviour). */
export function loc(value: Localized | undefined, locale: string): string {
  if (!value) return "";
  return value[locale as Locale] || value.en;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (x: number) => x.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Kigali" });
}

/** Normalise a Rwandan mobile number to 2507XXXXXXXX, or null if invalid. */
export function normalizeMsisdn(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let local = digits;
  if (local.startsWith("250")) local = local.slice(3);
  if (local.startsWith("0")) local = local.slice(1);
  return /^7[2389]\d{7}$/.test(local) ? `250${local}` : null;
}

/** MTN: 078/079 · Airtel: 072/073. */
export function providerFor(msisdn: string | null): PaymentProvider | null {
  if (!msisdn) return null;
  const p = msisdn.slice(3, 5);
  if (p === "78" || p === "79") return "mtn";
  if (p === "72" || p === "73") return "airtel";
  return null;
}

export function displayPhone(msisdn: string): string {
  const local = "0" + msisdn.slice(3);
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

export function formatQty(q: number): string {
  return Number.isInteger(q) ? String(q) : q.toFixed(q < 1 ? 2 : 1).replace(/\.?0+$/, "");
}
