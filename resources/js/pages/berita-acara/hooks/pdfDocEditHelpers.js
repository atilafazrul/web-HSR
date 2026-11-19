import { parseDateToInput } from "../utils/dateHelpers";
import { nominalApiToInput } from "../../../utils/formatRupiahInput";

/** Plain text / baris baru → HTML editor (bullet list jika multi-baris). */
export function deskripsiToEditorHtml(text) {
  const raw = (text || "").trim();
  if (!raw) return "";
  if (raw.includes("<")) return raw;

  const escape = (s) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return `<p>${escape(raw)}</p>`;

  const lis = lines
    .map((line) => `<li>${escape(line.replace(/^[•\-\t ]+/, ""))}</li>`)
    .join("");

  return `<ul>${lis}</ul>`;
}

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
    divisi: data.divisi || defaults.divisi || "",
    lampiran: data.lampiran || "-",
    perihal: data.perihal || "Penawaran Harga",
    penerima_nama: data.penerima_nama || "",
    paragraf_pembuka: data.paragraf_pembuka || defaults.paragraf_pembuka || "",
    items:
      Array.isArray(data.items) && data.items.length > 0
        ? data.items.map((item) => ({
            nama_item: item.nama_item || "",
            deskripsi: deskripsiToEditorHtml(item.deskripsi),
            qty: item.qty || "1",
            unit: item.unit || "Ls",
            harga: nominalApiToInput(item.harga),
          }))
        : [{ nama_item: "", deskripsi: "", qty: "1", unit: "Ls", harga: "" }],
    show_total: data.show_total !== undefined && data.show_total !== null ? Boolean(data.show_total) : true,
    pakai_diskon: Boolean(data.pakai_diskon ?? (Number(data.diskon_nominal || 0) > 0)),
    diskon_persen: String(data.diskon_persen ?? 0),
    pakai_ppn: Boolean(data.pakai_ppn),
    ppn_persen: String(data.ppn_persen ?? 11),
    kota_tanda_tangan: data.kota_tanda_tangan || "Tangerang",
    tanggal_tanda_tangan: parseDateToInput(data.tanggal_tanda_tangan),
    tanggal_tanda_tangan_display: data.tanggal_tanda_tangan || "",
    nama_penandatangan: data.nama_penandatangan || defaults.nama_penandatangan || "",
    jabatan_penandatangan: data.jabatan_penandatangan || defaults.jabatan_penandatangan || "Direktur",
    syarat_ketentuan: data.syarat_ketentuan || defaults.syarat_ketentuan || "",
    paragraf_penutup: data.paragraf_penutup || defaults.paragraf_penutup || "",
    pakai_rekapitulasi: Boolean(data.pakai_rekapitulasi),
    rekapitulasi_judul: data.rekapitulasi_judul || "",
    rekapitulasi_data:
      Array.isArray(data.rekapitulasi_data) && data.rekapitulasi_data.length > 0
        ? data.rekapitulasi_data.map((cat, catIdx) => ({
            nomor_romawi: cat.nomor_romawi || "",
            judul_kategori: cat.judul_kategori || "",
            qty: cat.qty || "1",
            unit: cat.unit || "Ls",
            items:
              Array.isArray(cat.items) && cat.items.length > 0
                ? cat.items.map((item, itmIdx) => ({
                    nomor: item.nomor ?? itmIdx + 1,
                    deskripsi: item.deskripsi || "",
                    satuan: item.satuan || "",
                    vol: item.vol !== undefined ? String(item.vol) : "1",
                    material: nominalApiToInput(item.material),
                    jasa: nominalApiToInput(item.jasa),
                  }))
                : [
                    {
                      nomor: 1,
                      deskripsi: "",
                      satuan: "ls",
                      vol: "1",
                      material: "",
                      jasa: "",
                    },
                  ],
          }))
        : [],
  };
}
