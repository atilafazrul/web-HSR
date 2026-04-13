/** Hanya digit dari input pengguna */
export function digitsOnly(s) {
  return String(s ?? "").replace(/\D/g, "");
}

/**
 * Format ribuan Indonesia (titik): 10000 → "10.000"
 * @param {string} digits — hanya angka, tanpa pemisah
 */
export function formatRibuanId(digits) {
  const d = digitsOnly(digits);
  if (!d) return "";
  const trimmed = d.replace(/^0+(?=\d)/, "") || "0";
  return trimmed.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Dari tampilan "10.000" ke angka integer untuk API */
export function parseRibuanId(s) {
  const d = digitsOnly(s);
  if (!d) return 0;
  const n = parseInt(d, 10);
  return Number.isFinite(n) ? n : 0;
}

/** Nilai dari API / angka murni → string untuk field input */
export function nominalApiToInput(v) {
  if (v == null || v === "") return "";
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n <= 0) return "";
  return formatRibuanId(String(n));
}
