import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian } from "../utils/dateHelpers";
import { parseRibuanId } from "../../../utils/formatRupiahInput";
import { useDocumentSchedule } from "./useDocumentSchedule";
import { mapSphDocToForm } from "./pdfDocEditHelpers";
import { scopeDocumentHistory } from "../utils/historyScope";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

export const PARAGRAF_PEMBUKA_TEMPLATES = {
  service:
    "<p>Terima kasih atas kesempatan yang di berikan kepada kami, kami selaku Perusahaan Suplier Alat - alat Kesehatan dan Jasa Pemeliharaan / Perbaikan Alat - alat kesehatan, dengan ini perkenankan kami mengajukan penawaran harga barang dan jasa dengan rincian sebagai berikut :</p>",
  kontraktor:
    "<p>Terima kasih atas kesempatan yang telah diberikan kepada kami, kami PT. Hayati Semesta Raharja sebagai Kontraktor Ruang Medis dan Kontraktor Umum. Melalui surat ini, izinkan kami mengirimkan surat penawaran dengan rincian sebagai berikut :</p>",
  it:
    "<p>\u00A0\u00A0\u00A0\u00A0Sehubungan dengan kebutuhan infrastruktur TI di perusahaan bapak/ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan penawaran sesuai dengan kebutuhan sistem di perusahaan bapak/ibu.</p><p>Berikut kami sampaikan rincian penawarannya:</p>",
  sales:
    "<p>Terima kasih atas kesempatan yang telah diberikan kepada kami. Sehubungan dengan kebutuhan produk dan pengadaan di perusahaan Bapak/Ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan surat penawaran harga dengan rincian sebagai berikut :</p>",
  logistik:
    "<p>Terima kasih atas kesempatan yang telah diberikan kepada kami. Sehubungan dengan kebutuhan armada dan layanan logistik/pengiriman di perusahaan Bapak/Ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan penawaran dengan rincian sebagai berikut :</p>",
  purchasing:
    "<p>Terima kasih atas kesempatan yang telah diberikan kepada kami. Bersama ini kami dari PT. Hayati Semesta Raharja menyampaikan penawaran harga pengadaan barang dan material dengan rincian sebagai berikut :</p>",
};

export const getDefaultPembuka = (divisi) => {
  const d = String(divisi || "it").toLowerCase();
  return PARAGRAF_PEMBUKA_TEMPLATES[d] || PARAGRAF_PEMBUKA_TEMPLATES.it;
};

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX"];
export const getRoman = (idx) => ROMAN_NUMERALS[idx] || String(idx + 1);

const DEFAULT_PARAGRAF_PEMBUKA = PARAGRAF_PEMBUKA_TEMPLATES.it;

export const DEFAULT_SYARAT_NON_PPN =
  "<ol><li>Harga belum termasuk PPN 11%.</li><li>Pembayaran dilakukan 100% setelah barang diterima.</li><li>Penawaran ini berlaku selama 30 (tiga puluh) hari dari tanggal penerbitan penawaran.</li></ol>";

export const DEFAULT_SYARAT_PPN = (ppn = 11) =>
  `<ol><li>Harga sudah termasuk PPN ${ppn}%.</li><li>Pembayaran dilakukan 100% setelah barang diterima.</li><li>Penawaran ini berlaku selama 30 (tiga puluh) hari dari tanggal penerbitan penawaran.</li></ol>`;

export const DEFAULT_SYARAT_KONTRAKTOR =
  "<ol><li>Harga diatas sudah termasuk biaya material dan pengiriman</li><li>Jaminan retensi atau pemeliharaan (5%) dari nilai proyek selama 1 tahun</li><li>Termasuk PPN (11%)</li><li>Contact person Syahrul Roji (+62 899-9922-269)</li><li>Pembayaran (30%) deposit dan (65%) secara bertahap, dan retensi (5%) ditahan selama 1 tahun</li></ol>";

export const DEFAULT_PENUTUP =
  "<p>Untuk informasi lebih lanjut atau apabila terdapat hal yang ingin dikonsultasikan, Bapak/Ibu dapat menghubungi Nana Mahendra di nomor 0812-8722-2400.</p>";

export const DEFAULT_PENUTUP_KONTRAKTOR =
  "<p>Demikian, melalui surat penawaran ini, kami berharap dapat menjadi mitra layanan kesehatan yang Anda butuhkan. Terima kasih atas waktu dan perhatian Anda.</p>";

export const buildItemsFromRekap = (rekapData) => {
  if (!Array.isArray(rekapData) || rekapData.length === 0) {
    return [{ nama_item: "", deskripsi: "", qty: "1", unit: "Ls", harga: "" }];
  }
  return rekapData.map((cat, idx) => {
    const sub = (cat.items || []).reduce((sum, itm) => {
      const vol = Math.max(0, Number(itm.vol) || 1);
      const mat = parseRibuanId(itm.material);
      const jasa = parseRibuanId(itm.jasa);
      return sum + Math.round(vol * (mat + jasa));
    }, 0);

    return {
      nama_item: cat.judul_kategori || `Pekerjaan ${cat.nomor_romawi || getRoman(idx)}`,
      deskripsi: "",
      qty: cat.qty || "1",
      unit: cat.unit || "Ls",
      harga: sub > 0 ? new Intl.NumberFormat("id-ID").format(sub) : "",
    };
  });
};

function updateSyaratKetentuanPpn(currentSyarat, pakaiPpn, ppnPersen) {
  if (!currentSyarat) {
    return pakaiPpn ? DEFAULT_SYARAT_PPN(ppnPersen) : DEFAULT_SYARAT_NON_PPN;
  }
  const ppnPattern = /<li>Harga\s+(?:belum|sudah)\s+termasuk\s+PPN[^<]*<\/li>/i;
  if (ppnPattern.test(currentSyarat)) {
    const replacement = pakaiPpn
      ? `<li>Harga sudah termasuk PPN ${ppnPersen}%.</li>`
      : `<li>Harga belum termasuk PPN 11%.</li>`;
    return currentSyarat.replace(ppnPattern, replacement);
  }
  return currentSyarat;
}

export const applyDivisiChanges = (prev, newDivisi) => {
  const d = String(newDivisi || "it").toLowerCase();
  const nextPembuka = getDefaultPembuka(d);
  const nextVersion = (prev.templateVersion || 0) + 1;

  if (d === "kontraktor") {
    const rekapList =
      prev.rekapitulasi_data && prev.rekapitulasi_data.length > 0
        ? prev.rekapitulasi_data
        : [
            {
              nomor_romawi: "I",
              judul_kategori: "PRELIMINARIES",
              qty: "1",
              unit: "Ls",
              items: [
                {
                  nomor: 1,
                  deskripsi: "Mobilisasi dan Demobilisasi",
                  satuan: "ls",
                  vol: "1",
                  material: "",
                  jasa: "",
                },
              ],
            },
          ];

    return {
      ...prev,
      divisi: d,
      templateVersion: nextVersion,
      paragraf_pembuka: nextPembuka,
      syarat_ketentuan: DEFAULT_SYARAT_KONTRAKTOR,
      paragraf_penutup: DEFAULT_PENUTUP_KONTRAKTOR,
      pakai_rekapitulasi: true,
      pakai_ppn: true,
      ppn_persen: prev.ppn_persen || "11",
      rekapitulasi_data: rekapList,
      items: buildItemsFromRekap(rekapList),
    };
  }

  // Divisi Non-Kontraktor (Service, IT, Sales, dll): Halaman 2 TIDAK ADA
  const isPpn = Boolean(prev.pakai_ppn);
  const nextSyarat = isPpn
    ? DEFAULT_SYARAT_PPN(prev.ppn_persen || 11)
    : DEFAULT_SYARAT_NON_PPN;

  // Jika sebelumnya rekapitulasi aktif atau kontraktor, reset items ke baris standar
  const wasRekap = prev.pakai_rekapitulasi || prev.divisi === "kontraktor";
  const nextItems = wasRekap
    ? [{ nama_item: "", deskripsi: "", qty: "1", unit: "unit", harga: "" }]
    : prev.items;

  return {
    ...prev,
    divisi: d,
    templateVersion: nextVersion,
    paragraf_pembuka: nextPembuka,
    syarat_ketentuan: nextSyarat,
    paragraf_penutup: DEFAULT_PENUTUP,
    pakai_rekapitulasi: false, // Halaman 2 khusus kontraktor saja!
    rekapitulasi_data: [],
    items: nextItems,
  };
};

export const useSPH = (projekKerjaId = null, defaultDivisi = null) => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [fetchingNomor, setFetchingNomor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [nextNomorSurat, setNextNomorSurat] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNomorSurat, setEditNomorSurat] = useState("");

  const {
    scheduleSectionProps,
    handleSchedule,
  } = useDocumentSchedule(projekKerjaId, "sph");

  const initialDivisi = defaultDivisi || "it";

  const [formData, setFormData] = useState(() => {
    const base = {
      divisi: initialDivisi,
      lampiran: "-",
      perihal: "Penawaran Harga",
      penerima_nama: "",
      paragraf_pembuka: getDefaultPembuka(initialDivisi),
      items: [{ nama_item: "", deskripsi: "", qty: "1", unit: "Ls", harga: "" }],
      show_total: true,
      pakai_diskon: false,
      diskon_persen: "0",
      pakai_ppn: false,
      ppn_persen: "11",
      kota_tanda_tangan: "Tangerang",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      nama_penandatangan: "Syahrul Roji",
      jabatan_penandatangan: "Direktur",
      syarat_ketentuan: DEFAULT_SYARAT_NON_PPN,
      paragraf_penutup: DEFAULT_PENUTUP,
      pakai_rekapitulasi: false,
      rekapitulasi_judul: "",
      rekapitulasi_data: [],
    };
    return applyDivisiChanges(base, initialDivisi);
  });

  // Jika dibuat dari konteks projek, sinkronkan divisi dari projek jika tersedia
  useEffect(() => {
    if (projekKerjaId && !isEditing) {
      api.get(`/projek-kerja/${projekKerjaId}`)
        .then((res) => {
          const p = res.data?.data || res.data;
          if (p?.divisi) {
            const d = String(p.divisi).toLowerCase();
            setFormData((prev) => applyDivisiChanges(prev, d));
          }
        })
        .catch((err) => console.error("Error fetching project for SPH:", err));
    }
  }, [projekKerjaId, isEditing]);

  const buildSubmitData = () => {
    const isKontraktor = String(formData.divisi || defaultDivisi || "it").toLowerCase() === "kontraktor";
    const isRekap = isKontraktor && Boolean(formData.pakai_rekapitulasi);
    const normalizedRekap = isRekap
      ? (formData.rekapitulasi_data || []).map((cat, idx) => ({
          nomor_romawi: cat.nomor_romawi || getRoman(idx),
          judul_kategori: (cat.judul_kategori || "").trim(),
          qty: (cat.qty || "1").trim() || "1",
          unit: (cat.unit || "Ls").trim() || "Ls",
          items: (cat.items || []).map((item, itmIdx) => ({
            nomor: Number(item.nomor) || itmIdx + 1,
            deskripsi: (item.deskripsi || "").trim(),
            satuan: (item.satuan || "").trim(),
            vol: Number(item.vol) || 1,
            material: parseRibuanId(item.material),
            jasa: parseRibuanId(item.jasa),
          })),
        }))
      : [];

    // Jika pakai_rekapitulasi aktif (khusus kontraktor), baris item di Halaman 1 diambil langsung dari Kategori Rekapitulasi
    const normalizedItems = isRekap && normalizedRekap.length > 0
      ? normalizedRekap.map((cat, idx) => {
          const catSub = (cat.items || []).reduce((sum, itm) => {
            const vol = Math.max(0, Number(itm.vol) || 1);
            return sum + Math.round(vol * ((itm.material || 0) + (itm.jasa || 0)));
          }, 0);
          return {
            nama_item: cat.judul_kategori || `Pekerjaan ${cat.nomor_romawi || getRoman(idx)}`,
            deskripsi: "",
            qty: cat.qty || "1",
            unit: cat.unit || "Ls",
            harga: catSub,
          };
        })
      : formData.items.map((item) => ({
          nama_item: item.nama_item,
          deskripsi: item.deskripsi,
          qty: item.qty,
          unit: item.unit || "Ls",
          harga: parseRibuanId(item.harga),
        }));

    return {
      divisi: formData.divisi || defaultDivisi || "it",
      lampiran: (formData.lampiran || "").trim() || "-",
      perihal: (formData.perihal || "").trim() || "Penawaran Harga",
      penerima_nama: formData.penerima_nama,
      paragraf_pembuka: formData.paragraf_pembuka,
      items: normalizedItems,
      show_total: formData.show_total !== false,
      pakai_diskon: Boolean(formData.pakai_diskon),
      diskon_persen: Number(formData.diskon_persen || 0),
      pakai_ppn: Boolean(formData.pakai_ppn),
      ppn_persen: Number(formData.ppn_persen || 11),
      kota_tanda_tangan: (formData.kota_tanda_tangan || "").trim() || "Tangerang",
      tanggal_tanda_tangan:
        formData.tanggal_tanda_tangan_display ||
        formatDateToIndonesian(formData.tanggal_tanda_tangan),
      nama_penandatangan: (formData.nama_penandatangan || "").trim() || null,
      jabatan_penandatangan: (formData.jabatan_penandatangan || "").trim() || "Direktur",
      syarat_ketentuan: formData.syarat_ketentuan,
      paragraf_penutup: formData.paragraf_penutup,
      pakai_rekapitulasi: isRekap,
      rekapitulasi_judul: isRekap ? ((formData.rekapitulasi_judul || "").trim() || null) : null,
      rekapitulasi_data: normalizedRekap,
      ...(projekKerjaId ? { projek_kerja_id: Number(projekKerjaId) } : {}),
    };
  };

  useEffect(() => {
    if (activeTab === "form") {
      fetchNextNomorSurat();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "history" || activeTab === "history-project") {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchNextNomorSurat = async () => {
    setFetchingNomor(true);
    try {
      const response = await api.get("/sph/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/PH-HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await api.get("/sph/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => {
        let nextSyarat = prev.syarat_ketentuan;
        if (name === "pakai_ppn") {
          nextSyarat = updateSyaratKetentuanPpn(
            prev.syarat_ketentuan,
            checked,
            prev.ppn_persen || 11
          );
        }
        if (name === "pakai_rekapitulasi") {
          // Hanya divisi kontraktor yang boleh mengaktifkan rekapitulasi (Halaman 2)
          if (prev.divisi !== "kontraktor") {
            return { ...prev, pakai_rekapitulasi: false };
          }
          const rekapList =
            checked && (!prev.rekapitulasi_data || prev.rekapitulasi_data.length === 0)
              ? [
                  {
                    nomor_romawi: "I",
                    judul_kategori: "PRELIMINARIES",
                    qty: "1",
                    unit: "Ls",
                    items: [
                      {
                        nomor: 1,
                        deskripsi: "Mobilisasi dan Demobilisasi",
                        satuan: "ls",
                        vol: "1",
                        material: "",
                        jasa: "",
                      },
                    ],
                  },
                ]
              : prev.rekapitulasi_data;

          return {
            ...prev,
            pakai_rekapitulasi: checked,
            rekapitulasi_data: rekapList,
            items: checked ? buildItemsFromRekap(rekapList) : prev.items,
          };
        }
        return {
          ...prev,
          [name]: checked,
          syarat_ketentuan: nextSyarat,
        };
      });
      return;
    }
    if (name === "divisi") {
      setFormData((prev) => applyDivisiChanges(prev, value));
      return;
    }
    if (name === "ppn_persen") {
      setFormData((prev) => {
        let nextSyarat = prev.syarat_ketentuan;
        if (prev.pakai_ppn) {
          nextSyarat = updateSyaratKetentuanPpn(
            prev.syarat_ketentuan,
            true,
            value || 11
          );
        }
        return {
          ...prev,
          ppn_persen: value,
          syarat_ketentuan: nextSyarat,
        };
      });
      return;
    }
    if (name === "tanggal_tanda_tangan") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tanggal_tanda_tangan_display: formatDateToIndonesian(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRichTextChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (field === "harga") {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value;
    }
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { nama_item: "", deskripsi: "", qty: "1", harga: "" }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const resetForm = () => {
    const curDivisi = formData.divisi || defaultDivisi || "it";
    const base = {
      divisi: curDivisi,
      lampiran: "-",
      perihal: "Penawaran Harga",
      penerima_nama: "",
      paragraf_pembuka: getDefaultPembuka(curDivisi),
      items: [{ nama_item: "", deskripsi: "", qty: "1", unit: "Ls", harga: "" }],
      show_total: true,
      pakai_diskon: false,
      diskon_persen: "0",
      pakai_ppn: false,
      ppn_persen: "11",
      kota_tanda_tangan: "Tangerang",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      nama_penandatangan: "Syahrul Roji",
      jabatan_penandatangan: "Direktur",
      syarat_ketentuan: DEFAULT_SYARAT_NON_PPN,
      paragraf_penutup: DEFAULT_PENUTUP,
      pakai_rekapitulasi: false,
      rekapitulasi_judul: "",
      rekapitulasi_data: [],
    };
    setFormData(applyDivisiChanges(base, curDivisi));
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = buildSubmitData();

      if (isEditing && editId) {
        await api.put(`/sph/${editId}`, submitData);
        alert(tr("Dokumen SPH berhasil diperbarui!", "SPH document updated successfully!"));
        setIsEditing(false);
        setEditId(null);
        setEditNomorSurat("");
        resetForm();
        setActiveTab(projekKerjaId ? "history-project" : "history");
        fetchHistory();
        return;
      }

      const response = await api.post("/sph/pdf", submitData, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SPH-${nextNomorSurat.replace(/\//g, "-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`${tr("PDF SPH berhasil di-generate!", "SPH PDF generated successfully!")}\n${tr("Nomor Surat", "Letter Number")}: ${nextNomorSurat}`);
      resetForm();
      fetchNextNomorSurat();
      fetchHistory();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(tr("Gagal generate PDF. Silakan coba lagi.", "Failed to generate PDF. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleGenerate = (formElement) => {
    if (isEditing) {
      alert(tr("Batalkan mode edit terlebih dahulu untuk menjadwalkan generate.", "Cancel edit mode first to schedule generation."));
      return;
    }
    handleSchedule(buildSubmitData(), formElement);
  };

  const handleView = (item) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedItem(null);
  };

  const handleGeneratePDF = async (item) => {
    setLoading(true);
    try {
      const response = await api.get(`/sph/${item.id}/pdf`, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `SPH-${item.nomor_surat.replace(/\//g, "-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(tr("Gagal generate PDF. Silakan coba lagi.", "Failed to generate PDF. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(tr("Yakin ingin menghapus dokumen ini dari riwayat?", "Are you sure you want to delete this document from history?"))) {
      try {
        await api.delete(`/sph/${id}`);
        fetchHistory();
      } catch (error) {
        console.error("Error deleting:", error);
      }
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await api.get(`/sph/${item.id}`);
      const data = response.data.data;
      const targetDivisi = data.divisi || defaultDivisi || "it";
      const isTargetKontraktor = String(targetDivisi).toLowerCase() === "kontraktor";
      const mapped = mapSphDocToForm(data, {
        divisi: targetDivisi,
        paragraf_pembuka: getDefaultPembuka(targetDivisi),
        syarat_ketentuan: isTargetKontraktor ? DEFAULT_SYARAT_KONTRAKTOR : DEFAULT_SYARAT_NON_PPN,
        paragraf_penutup: isTargetKontraktor ? DEFAULT_PENUTUP_KONTRAKTOR : DEFAULT_PENUTUP,
        nama_penandatangan: "Syahrul Roji",
        jabatan_penandatangan: "Direktur",
      });
      if (!isTargetKontraktor) {
        mapped.pakai_rekapitulasi = false;
        mapped.rekapitulasi_data = [];
      }
      mapped.templateVersion = Date.now();
      setFormData(mapped);
      setEditId(item.id);
      setEditNomorSurat(data.nomor_surat || item.nomor_surat || "");
      setIsEditing(true);
      setActiveTab("form");
      setShowViewModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error fetching document detail:", error);
      alert(tr("Gagal memuat data untuk diedit", "Failed to load data for editing"));
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setEditNomorSurat("");
    resetForm();
  };

  const addRekapCategory = () => {
    setFormData((prev) => {
      const currentList = prev.rekapitulasi_data || [];
      const newIndex = currentList.length;
      const nextRekap = [
        ...currentList,
        {
          nomor_romawi: getRoman(newIndex),
          judul_kategori: "",
          qty: "1",
          unit: "Ls",
          items: [
            {
              nomor: 1,
              deskripsi: "",
              satuan: "ls",
              vol: "1",
              material: "",
              jasa: "",
            },
          ],
        },
      ];
      return {
        ...prev,
        rekapitulasi_data: nextRekap,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(nextRekap) : prev.items,
      };
    });
  };

  const removeRekapCategory = (catIdx) => {
    setFormData((prev) => {
      const filtered = (prev.rekapitulasi_data || []).filter((_, idx) => idx !== catIdx);
      const reindexed = filtered.map((c, i) => ({
        ...c,
        nomor_romawi: getRoman(i),
      }));
      return {
        ...prev,
        rekapitulasi_data: reindexed,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(reindexed) : prev.items,
      };
    });
  };

  const updateRekapCategory = (catIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.rekapitulasi_data || [])];
      if (updated[catIdx]) {
        updated[catIdx] = { ...updated[catIdx], [field]: value };
      }
      return {
        ...prev,
        rekapitulasi_data: updated,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(updated) : prev.items,
      };
    });
  };

  const updateRekapCategoryMeta = (catIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.rekapitulasi_data || [])];
      if (updated[catIdx]) {
        updated[catIdx] = { ...updated[catIdx], [field]: value };
      }
      return {
        ...prev,
        rekapitulasi_data: updated,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(updated) : prev.items,
      };
    });
  };

  const addRekapItem = (catIdx) => {
    setFormData((prev) => {
      const updated = [...(prev.rekapitulasi_data || [])];
      if (updated[catIdx]) {
        const catItems = updated[catIdx].items || [];
        updated[catIdx] = {
          ...updated[catIdx],
          items: [
            ...catItems,
            {
              nomor: catItems.length + 1,
              deskripsi: "",
              satuan: "ls",
              vol: "1",
              material: "",
              jasa: "",
            },
          ],
        };
      }
      return {
        ...prev,
        rekapitulasi_data: updated,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(updated) : prev.items,
      };
    });
  };

  const removeRekapItem = (catIdx, itemIdx) => {
    setFormData((prev) => {
      const updated = [...(prev.rekapitulasi_data || [])];
      if (updated[catIdx]) {
        const catItems = (updated[catIdx].items || []).filter((_, i) => i !== itemIdx);
        const reindexedItems = catItems.map((itm, i) => ({
          ...itm,
          nomor: i + 1,
        }));
        updated[catIdx] = {
          ...updated[catIdx],
          items: reindexedItems,
        };
      }
      return {
        ...prev,
        rekapitulasi_data: updated,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(updated) : prev.items,
      };
    });
  };

  const updateRekapItem = (catIdx, itemIdx, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.rekapitulasi_data || [])];
      if (updated[catIdx] && updated[catIdx].items && updated[catIdx].items[itemIdx]) {
        const catItems = [...updated[catIdx].items];
        catItems[itemIdx] = {
          ...catItems[itemIdx],
          [field]: value,
        };
        updated[catIdx] = {
          ...updated[catIdx],
          items: catItems,
        };
      }
      return {
        ...prev,
        rekapitulasi_data: updated,
        items: prev.pakai_rekapitulasi ? buildItemsFromRekap(updated) : prev.items,
      };
    });
  };

  const applyPembukaTemplate = (templateKey) => {
    setFormData((prev) => applyDivisiChanges(prev, templateKey));
  };

  const syncRekapToMainItems = () => {
    if (!formData.rekapitulasi_data || formData.rekapitulasi_data.length === 0) {
      alert(tr("Belum ada kategori pekerjaan pada Rekapitulasi", "No categories in Rekapitulasi yet"));
      return;
    }

    const newItems = formData.rekapitulasi_data.map((cat, idx) => {
      const sub = (cat.items || []).reduce((sum, itm) => {
        const vol = Math.max(0, Number(itm.vol) || 1);
        const mat = parseRibuanId(itm.material);
        const jasa = parseRibuanId(itm.jasa);
        return sum + Math.round(vol * (mat + jasa));
      }, 0);

      return {
        nama_item: cat.judul_kategori || `Pekerjaan ${cat.nomor_romawi || getRoman(idx)}`,
        deskripsi: "",
        qty: "1 ls",
        harga: sub > 0 ? new Intl.NumberFormat("id-ID").format(sub) : "",
      };
    });

    setFormData((prev) => ({
      ...prev,
      items: newItems.length > 0 ? newItems : prev.items,
    }));

    alert(tr("Rincian Halaman 1 berhasil disinkronkan dari Rekapitulasi!", "Page 1 details successfully synchronized from Rekapitulasi!"));
  };

  const rekapCategorySubtotals = (formData.rekapitulasi_data || []).map((cat) => {
    return (cat.items || []).reduce((sum, itm) => {
      const vol = Math.max(0, Number(itm.vol) || 1);
      const mat = parseRibuanId(itm.material);
      const jasa = parseRibuanId(itm.jasa);
      return sum + Math.round(vol * (mat + jasa));
    }, 0);
  });

  const rekapSubtotal = rekapCategorySubtotals.reduce((sum, val) => sum + val, 0);
  const rekapVat = formData.pakai_ppn
    ? Math.round(rekapSubtotal * (Number(formData.ppn_persen || 11) / 100))
    : 0;
  const rekapGrandTotal = rekapSubtotal + rekapVat;

  const { filteredHistory, historyAllCount, historyProjectCount } = scopeDocumentHistory(
    historyData,
    searchTerm,
    (item, term) =>
      item.nomor_surat?.toLowerCase().includes(term) ||
      item.penerima_nama?.toLowerCase().includes(term),
    activeTab,
    projekKerjaId
  );

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));

  const estimatedSubtotal = formData.items.reduce((sum, item) => {
    const harga = parseRibuanId(item.harga);
    const qty = Math.max(1, Number(String(item.qty || "1").replace(/\D/g, "")) || 1);
    return sum + harga * qty;
  }, 0);

  const diskonPersenVal = Math.min(100, Math.max(0, Number(formData.diskon_persen || 0)));
  const estimatedDiskon = formData.pakai_diskon
    ? Math.round(estimatedSubtotal * (diskonPersenVal / 100))
    : 0;
  const estimatedDpp = Math.max(0, estimatedSubtotal - estimatedDiskon);

  const estimatedPpn = formData.pakai_ppn
    ? Math.round(estimatedDpp * (Number(formData.ppn_persen || 11) / 100))
    : 0;

  const estimatedTotal = estimatedDpp + estimatedPpn;

  return {
    activeTab,
    setActiveTab,
    loading,
    fetchingNomor,
    nextNomorSurat,
    searchTerm,
    setSearchTerm,
    formData,
    historyData,
    filteredHistory,
    historyAllCount,
    historyProjectCount,
    fetchingHistory,
    selectedItem,
    showViewModal,
    isEditing,
    editNomorSurat,
    handleInputChange,
    handleRichTextChange,
    handleItemChange,
    addItem,
    removeItem,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleDelete,
    handleEdit,
    cancelEdit,
    fetchHistory,
    scheduleSectionProps,
    handleScheduleGenerate,
    formatRupiah,
    estimatedSubtotal,
    estimatedDiskon,
    estimatedDpp,
    estimatedPpn,
    estimatedTotal,
    applyPembukaTemplate,
    addRekapCategory,
    removeRekapCategory,
    updateRekapCategory,
    updateRekapCategoryMeta,
    addRekapItem,
    removeRekapItem,
    updateRekapItem,
    syncRekapToMainItems,
    rekapCategorySubtotals,
    rekapSubtotal,
    rekapVat,
    rekapGrandTotal,
    PARAGRAF_PEMBUKA_TEMPLATES,
  };
};
