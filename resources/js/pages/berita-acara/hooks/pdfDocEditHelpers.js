import { parseDateToInput } from "../utils/dateHelpers";

/** Map BAST / BAUF / BAM document API response to form state */
export function mapKlientDocToForm(data, tanggalField, includeKota = false) {
  const base = {
    nama_hari: data.nama_hari || "",
    [tanggalField]: parseDateToInput(data[tanggalField]),
    [`${tanggalField}_display`]: data[tanggalField] || "",
    nama_klient: data.nama_klient || "",
    tanggal_tanda_tangan: parseDateToInput(data.tanggal_tanda_tangan),
    tanggal_tanda_tangan_display: data.tanggal_tanda_tangan || "",
    ttd_hsr: data.ttd_hsr || "",
    ttd_klien: data.ttd_klien || "",
    nama_ttd_hsr: data.nama_ttd_hsr || "",
    nama_ttd_klien: data.nama_ttd_klien || "",
    hasil: data.hasil || "BAIK",
    items:
      Array.isArray(data.items) && data.items.length > 0
        ? data.items
        : [{ nama_alat: "", merk: "", jumlah: "1" }],
  };

  if (includeKota) {
    base.kota_tanda_tangan = data.kota_tanda_tangan || "Tangerang";
  }

  return base;
}

export function mapSphDocToForm(data, defaults = {}) {
  return {
    lampiran: data.lampiran || "-",
    perihal: data.perihal || "Penawaran Harga",
    penerima_nama: data.penerima_nama || "",
    paragraf_pembuka: data.paragraf_pembuka || defaults.paragraf_pembuka || "",
    items:
      Array.isArray(data.items) && data.items.length > 0
        ? data.items.map((item) => ({
            nama_item: item.nama_item || "",
            deskripsi: item.deskripsi || "",
            qty: item.qty || "1",
            harga: item.harga ?? "",
          }))
        : [{ nama_item: "", deskripsi: "", qty: "1", harga: "" }],
    kota_tanda_tangan: data.kota_tanda_tangan || "Tangerang",
    tanggal_tanda_tangan: parseDateToInput(data.tanggal_tanda_tangan),
    tanggal_tanda_tangan_display: data.tanggal_tanda_tangan || "",
    nama_penandatangan: data.nama_penandatangan || defaults.nama_penandatangan || "",
    jabatan_penandatangan: data.jabatan_penandatangan || defaults.jabatan_penandatangan || "Direktur",
    syarat_ketentuan: data.syarat_ketentuan || defaults.syarat_ketentuan || "",
    paragraf_penutup: data.paragraf_penutup || defaults.paragraf_penutup || "",
  };
}
