const APP_TIMEZONE = "Asia/Jakarta";
/** Validasi duplikat hanya berlaku mulai tanggal ini (Asia/Jakarta). Data sebelumnya tetap boleh sama. */
const ENFORCE_FROM_DATE = "2026-08-24";

const isOnOrAfterEnforceDate = (value, fallbackDate = null) => {
  const dateKey = normalizeBiayaDateKey(value, fallbackDate);
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return true;
  return dateKey >= ENFORCE_FROM_DATE;
};

const normalizeBiayaDateKey = (value, fallbackDate = null) => {
  const raw = String(value || "").trim();
  const d = raw ? new Date(raw) : fallbackDate ? new Date(fallbackDate) : null;
  if (!d || Number.isNaN(d.getTime())) {
    if (fallbackDate) {
      const fb = new Date(fallbackDate);
      if (!Number.isNaN(fb.getTime())) {
        return fb.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
      }
    }
    return raw ? raw.toLowerCase() : "";
  }
  return d.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
};

const formatBiayaDateForMessage = (value, fallbackDate = null) => {
  const raw = String(value || "").trim();
  const d = raw ? new Date(raw) : fallbackDate ? new Date(fallbackDate) : null;
  if (!d || Number.isNaN(d.getTime())) return raw || "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  });
};

const kategoriLabelMap = {
  jalan: "Biaya Jalan",
  pengeluaran: "Biaya Pengeluaran",
  reimbursment: "Biaya Reimbursment",
};

const buildDuplicateMessage = (categoryLabel, tanggalDisplay, nominal, keterangan, formatRupiah) => {
  let nominalText =
    typeof formatRupiah === "function" ? formatRupiah(nominal) : String(nominal);
  nominalText = String(nominalText).replace(/^\s*Rp\s*/i, "").trim();
  return `Duplikat ${categoryLabel}: tanggal ${tanggalDisplay}, nominal Rp ${nominalText}, keterangan "${keterangan}" sudah ada. Ubah tanggal, nominal, atau keterangan.`;
};

const businessKeyForRow = (row, parseNominal, fallbackDate = new Date()) => {
  const nominal = parseNominal(row?.nominal);
  const keterangan = String(row?.keterangan || "").trim().toLowerCase();
  if (nominal <= 0 && keterangan === "") return null;

  const createdAtRaw = String(row?.created_at || "").trim();
  const dateKey = normalizeBiayaDateKey(
    createdAtRaw,
    createdAtRaw ? null : fallbackDate
  );
  if (!dateKey) return null;

  return `${dateKey}|${nominal}|${keterangan}`;
};

/**
 * Validasi array biaya proyek — tanggal (hari) + nominal + keterangan sama = duplikat.
 */
export const assertNoDuplicateBiayaItems = (rows, categoryLabel, { parseNominal, formatRupiah } = {}) => {
  const toNominal = parseNominal || ((v) => Number(v) || 0);
  const seen = new Set();
  const fallbackDate = new Date();

  for (const row of rows || []) {
    const createdAtRaw = String(row?.created_at || "").trim();
    if (!isOnOrAfterEnforceDate(createdAtRaw, createdAtRaw ? null : fallbackDate)) continue;

    const key = businessKeyForRow(row, toNominal, fallbackDate);
    if (!key) continue;

    if (seen.has(key)) {
      throw new Error(
        buildDuplicateMessage(
          categoryLabel,
          formatBiayaDateForMessage(createdAtRaw, createdAtRaw ? null : fallbackDate),
          toNominal(row?.nominal),
          String(row?.keterangan || "").trim(),
          formatRupiah
        )
      );
    }
    seen.add(key);
  }
};

/**
 * Validasi biaya dashboard (di luar proyek) terhadap daftar item yang sudah ada.
 */
export const assertNoDuplicateDashboardBiaya = (
  items,
  { kategori, nominal, keterangan, createdAt, excludeId = null, formatRupiah } = {}
) => {
  const categoryLabel = kategoriLabelMap[kategori] || kategori;
  const nom = Number(nominal) || 0;
  const ket = String(keterangan || "").trim().toLowerCase();
  const refDate = createdAt ? new Date(createdAt) : new Date();
  const dateKey = normalizeBiayaDateKey(createdAt, createdAt ? null : refDate);
  if (!isOnOrAfterEnforceDate(createdAt, createdAt ? null : refDate)) {
    return;
  }

  const duplicate = (items || []).find((row) => {
    if (excludeId != null && String(row.id) === String(excludeId)) return false;
    if (String(row.kategori) !== String(kategori)) return false;
    if (normalizeBiayaDateKey(row.created_at) !== dateKey) return false;
    const rowNom = Number(row.nominal) || 0;
    const rowKet = String(row.keterangan || "").trim().toLowerCase();
    return rowNom === nom && rowKet === ket;
  });

  if (duplicate) {
    throw new Error(
      buildDuplicateMessage(
        categoryLabel,
        formatBiayaDateForMessage(createdAt, createdAt ? null : refDate),
        nom,
        String(keterangan || "").trim(),
        formatRupiah
      )
    );
  }
};

export { normalizeBiayaDateKey, formatBiayaDateForMessage, kategoriLabelMap, APP_TIMEZONE };
