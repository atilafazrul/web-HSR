import { useState, useEffect, useMemo } from "react";
import api from "../../../api/axiosConfig";
import { nominalApiToInput, parseRibuanId } from "../../../utils/formatRupiahInput";
import { scopeDocumentHistory } from "../utils/historyScope";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

const DEFAULT_CATATAN = "<p>Pembayaran : 7641749137<br>BANK BCA a/n PT. HAYATI<br>SEMESTA RAHARJA</p>";
const DEFAULT_CATATAN_NON_PPN = "<p>Non PPN<br>Pembayaran : 8880253302<br>BANK BCA an SYAHRUL ROJI</p>";
const KNOWN_DEFAULT_CATATANS = [DEFAULT_CATATAN, DEFAULT_CATATAN_NON_PPN];

const parseDateToDateObj = (tanggal) => {
  if (!tanggal) return new Date();
  if (tanggal instanceof Date) return tanggal;
  const str = String(tanggal).trim();
  if (!str) return new Date();
  const direct = new Date(str);
  if (!Number.isNaN(direct.getTime())) return direct;

  const idMonths = {
    januari: "january", februari: "february", maret: "march",
    april: "april", mei: "may", juni: "june",
    juli: "july", agustus: "august", september: "september",
    oktober: "october", november: "november", desember: "december",
  };
  let norm = str.toLowerCase();
  for (const [id, en] of Object.entries(idMonths)) {
    norm = norm.replace(new RegExp(`\\b${id}\\b`, "g"), en);
  }
  const parsed = new Date(norm);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateEnglish = (dateString) => {
  if (!dateString) return "";
  const date = parseDateToDateObj(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const formatInvoiceNumber = (nomorUrut, divisi, tanggal) => {
  const codeMap = {
    it: "INV-DIVIT",
    sales: "INV-DIVSAL",
    service: "INV-DIVSER",
    bhp: "INV-DIVPRO",
    dipro: "INV-DIVPRO",
    divpro: "INV-DIVPRO",
    projek: "INV-DIVPRO",
    kontraktor: "INV-DIVKON",
    logistik: "INV-DIVLOG",
    purchasing: "INV-DIVPUR",
    siplah: "INV-DIVSIP",
  };
  const d = String(divisi || "it").toLowerCase();
  const code = codeMap[d] || "INV-DIVPRO";

  let numStr = String(nomorUrut ?? "").trim();
  if (numStr === "") {
    numStr = "001";
  } else if (/^\d+$/.test(numStr)) {
    numStr = numStr.padStart(3, "0");
  }

  const dateObj = parseDateToDateObj(tanggal);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();

  return `${numStr}/${code}/HSR/${day}${month}${year}`;
};

const emptyItem = () => ({ nama_item: "", unit: "pcs", qty: "1", harga: "" });

export const useInvoice = (projekKerjaId = null, defaultDivisi = null) => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [fetchingNomor, setFetchingNomor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [nextNomorSurat, setNextNomorSurat] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editNomorSurat, setEditNomorSurat] = useState("");

  const [formData, setFormData] = useState({
    divisi: defaultDivisi || "it",
    nomor_urut: "001",
    isNomorUrutCustom: false,
    tanggal_invoice: "",
    tanggal_invoice_display: "",
    tanggal_jatuh_tempo: "",
    tanggal_jatuh_tempo_display: "",
    no_po: "",
    pakai_ttd: true,
    pakai_cap: true,
    bill_to_nama: "",
    bill_to_alamat: "",
    bill_to_telepon: "",
    items: [emptyItem()],
    diskon: "",
    ppn_persen: "11",
    catatan: DEFAULT_CATATAN,
    terms: "",
    nama_penandatangan: "SYAHRUL ROJI",
    jabatan_penandatangan: "DIREKTUR",
  });

  const isDuplicateNomor = useMemo(() => {
    const cleanUrut = String(formData.nomor_urut ?? "").trim();
    if (!cleanUrut || !/^\d+$/.test(cleanUrut)) return null;

    const urutNum = Number(cleanUrut);
    const activeDiv = String(formData.divisi || defaultDivisi || "it").toLowerCase();
    const computed = formatInvoiceNumber(cleanUrut, activeDiv, formData.tanggal_invoice || formData.tanggal_invoice_display);

    const duplicate = (historyData || []).find((doc) => {
      if (isEditing && editId && String(doc.id) === String(editId)) return false;
      const sameUrut = Number(doc.nomor_urut) === urutNum;
      const sameSurat = String(doc.nomor_surat || "").trim().toLowerCase() === computed.toLowerCase();
      // Meskipun divisi berbeda, nomor urut tetap tidak boleh kembar
      return sameUrut || sameSurat;
    });

    if (duplicate) {
      return {
        nomor_urut: String(duplicate.nomor_urut).padStart(3, "0"),
        nomor_surat: duplicate.nomor_surat,
        bill_to_nama: duplicate.bill_to_nama,
        divisi: duplicate.divisi || "lain",
      };
    }
    return null;
  }, [formData.nomor_urut, formData.divisi, formData.tanggal_invoice, formData.tanggal_invoice_display, historyData, isEditing, editId, defaultDivisi]);

  const handleSuggestNextNomor = () => {
    setFormData((prev) => ({ ...prev, isNomorUrutCustom: false }));
    fetchNextNomorSurat();
  };

  const buildSubmitData = () => {
    let cleanUrut = String(formData.nomor_urut ?? "001").trim();
    if (/^\d+$/.test(cleanUrut)) {
      cleanUrut = cleanUrut.padStart(3, "0");
    }
    const computedNoSurat = formatInvoiceNumber(cleanUrut, formData.divisi, formData.tanggal_invoice || formData.tanggal_invoice_display);

    return {
      divisi: formData.divisi || defaultDivisi || "it",
      nomor_urut: cleanUrut,
      nomor_surat: computedNoSurat,
      tanggal_invoice: formData.tanggal_invoice_display || formatDateEnglish(formData.tanggal_invoice),
      tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo_display || formatDateEnglish(formData.tanggal_jatuh_tempo) || null,
      no_po: (formData.no_po || "").trim() || null,
      pakai_ttd: formData.pakai_ttd !== false,
      pakai_cap: formData.pakai_cap !== false,
      bill_to_nama: formData.bill_to_nama,
      bill_to_alamat: formData.bill_to_alamat,
      bill_to_telepon: formData.bill_to_telepon,
      items: formData.items.map((item) => ({
        nama_item: item.nama_item,
        unit: item.unit || "pcs",
        qty: Math.max(1, Number(item.qty || 1) || 1),
        harga: parseRibuanId(item.harga),
      })),
      diskon_nominal: parseRibuanId(formData.diskon),
      ppn_persen: Number(formData.ppn_persen || 11),
      catatan: (formData.catatan || "").trim() || (Number(formData.ppn_persen || 0) > 0 ? DEFAULT_CATATAN : DEFAULT_CATATAN_NON_PPN),
      terms: (formData.terms || "").trim() || null,
      nama_penandatangan: (formData.nama_penandatangan || "").trim() || "SYAHRUL ROJI",
      jabatan_penandatangan: (formData.jabatan_penandatangan || "").trim() || "DIREKTUR",
      ...(projekKerjaId ? { projek_kerja_id: Number(projekKerjaId) } : {}),
    };
  };

  // Jika dibuat dari konteks projek, sinkronkan divisi dari projek jika tersedia
  useEffect(() => {
    if (projekKerjaId) {
      api.get(`/projek-kerja/${projekKerjaId}`).then((res) => {
        const p = res.data?.data || res.data;
        if (p?.divisi) {
          const d = String(p.divisi).toLowerCase();
          setFormData((prev) => ({ ...prev, divisi: d }));
        }
      }).catch(() => {});
    }
  }, [projekKerjaId]);

  useEffect(() => {
    if (activeTab === "form" && !isEditing) fetchNextNomorSurat();
  }, [activeTab, formData.tanggal_invoice, formData.divisi, isEditing]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "history" || activeTab === "history-project") fetchHistory();
  }, [activeTab]);

  const fetchNextNomorSurat = async () => {
    setFetchingNomor(true);
    const activeDivisi = formData.divisi || defaultDivisi || "it";
    try {
      const params = {
        divisi: activeDivisi,
        ...(formData.tanggal_invoice ? { tanggal_invoice: formData.tanggal_invoice } : {}),
      };
      if (projekKerjaId) params.projek_kerja_id = projekKerjaId;
      const response = await api.get("/invoice/next-nomor", { params });
      const apiUrut = response.data.nomor_urut_formatted || (response.data.nomor_urut ? String(response.data.nomor_urut).padStart(3, "0") : "001");

      setFormData((prev) => {
        const urutToUse = prev.isNomorUrutCustom && prev.nomor_urut ? prev.nomor_urut : apiUrut;
        setNextNomorSurat(formatInvoiceNumber(urutToUse, activeDivisi, prev.tanggal_invoice || prev.tanggal_invoice_display));
        return {
          ...prev,
          nomor_urut: urutToUse,
        };
      });
    } catch (error) {
      console.error("Error fetching nomor invoice:", error);
      const currentUrut = formData.nomor_urut || "001";
      setNextNomorSurat(formatInvoiceNumber(currentUrut, activeDivisi, formData.tanggal_invoice || formData.tanggal_invoice_display));
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await api.get("/invoice/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching invoice history:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "nomor_urut") {
      setFormData((prev) => {
        setNextNomorSurat(formatInvoiceNumber(value, prev.divisi, prev.tanggal_invoice || prev.tanggal_invoice_display));
        return {
          ...prev,
          nomor_urut: value,
          isNomorUrutCustom: true,
        };
      });
    } else if (name === "divisi") {
      setFormData((prev) => {
        setNextNomorSurat(formatInvoiceNumber(prev.nomor_urut, value, prev.tanggal_invoice || prev.tanggal_invoice_display));
        return {
          ...prev,
          divisi: value,
          isNomorUrutCustom: false,
        };
      });
    } else if (name === "tanggal_invoice") {
      setFormData((prev) => {
        setNextNomorSurat(formatInvoiceNumber(prev.nomor_urut, prev.divisi, value));
        return {
          ...prev,
          tanggal_invoice: value,
          tanggal_invoice_display: formatDateEnglish(value),
        };
      });
    } else if (name === "tanggal_jatuh_tempo") {
      setFormData((prev) => ({
        ...prev,
        tanggal_jatuh_tempo: value,
        tanggal_jatuh_tempo_display: formatDateEnglish(value),
      }));
    } else if (name === "diskon") {
      setFormData((prev) => ({ ...prev, diskon: value }));
    } else if (name === "ppn_persen") {
      setFormData((prev) => {
        const isNonPpn = Number(value || 0) <= 0;
        const shouldAutoSwitch = KNOWN_DEFAULT_CATATANS.includes((prev.catatan || "").trim());
        return {
          ...prev,
          ppn_persen: value,
          catatan: shouldAutoSwitch
            ? isNonPpn
              ? DEFAULT_CATATAN_NON_PPN
              : DEFAULT_CATATAN
            : prev.catatan,
        };
      });
    } else if (name === "pakai_ttd") {
      setFormData((prev) => ({ ...prev, pakai_ttd: Boolean(value) }));
    } else if (name === "pakai_cap") {
      setFormData((prev) => ({ ...prev, pakai_cap: Boolean(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleRichTextChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    setFormData((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
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
    setFormData({
      divisi: defaultDivisi || "it",
      nomor_urut: "001",
      isNomorUrutCustom: false,
      tanggal_invoice: "",
      tanggal_invoice_display: "",
      tanggal_jatuh_tempo: "",
      tanggal_jatuh_tempo_display: "",
      no_po: "",
      pakai_ttd: true,
      pakai_cap: true,
      bill_to_nama: "",
      bill_to_alamat: "",
      bill_to_telepon: "",
      items: [emptyItem()],
      diskon: "",
      ppn_persen: "11",
      catatan: DEFAULT_CATATAN,
      terms: "",
      nama_penandatangan: "SYAHRUL ROJI",
      jabatan_penandatangan: "DIREKTUR",
    });
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDuplicateNomor) {
      const divName = isDuplicateNomor.divisi ? `Divisi ${String(isDuplicateNomor.divisi).toUpperCase()}` : "divisi lain";
      alert(
        tr(
          `Nomor urut ${isDuplicateNomor.nomor_urut} sudah digunakan pada ${isDuplicateNomor.nomor_surat} (${divName}). Meskipun divisi berbeda, nomor urut invoice tidak boleh kembar!`,
          `Sequence number ${isDuplicateNomor.nomor_urut} is already used on ${isDuplicateNomor.nomor_surat} (${divName}). Even with different divisions, sequence numbers cannot be duplicated!`
        )
      );
      return;
    }

    setLoading(true);
    try {
      const submitData = buildSubmitData();

      if (isEditing && editId) {
        await api.put(`/invoice/${editId}`, submitData);
        alert(tr("Dokumen Invoice berhasil diperbarui!", "Invoice document updated successfully!"));
        setIsEditing(false);
        setEditId(null);
        setEditNomorSurat("");
        resetForm();
        setActiveTab(projekKerjaId ? "history-project" : "history");
        fetchHistory();
        return;
      }

      const response = await api.post("/invoice/pdf", submitData, {
        responseType: "blob",
        headers: { "Content-Type": "application/json", Accept: "application/pdf" },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `INVOICE-${(submitData.nomor_surat || nextNomorSurat).replace(/\//g, "-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(tr("PDF Invoice berhasil di-generate!", "Invoice PDF generated successfully!"));
      resetForm();
      fetchNextNomorSurat();
      fetchHistory();
    } catch (error) {
      console.error("Error generating invoice PDF:", error);

      let apiMsg = null;
      if (error?.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          const json = JSON.parse(text);
          apiMsg =
            json?.errors?.nomor_urut?.[0] ||
            json?.errors?.nomor_surat?.[0] ||
            json?.message;
        } catch (_) {}
      } else if (typeof error?.response?.data === "object") {
        apiMsg =
          error?.response?.data?.errors?.nomor_urut?.[0] ||
          error?.response?.data?.errors?.nomor_surat?.[0] ||
          error?.response?.data?.message;
      }

      const msg = apiMsg
        ? apiMsg
        : error?.response?.status === 403
        ? tr("Hanya Super Admin yang dapat membuat Invoice.", "Only Super Admin can create invoices.")
        : tr("Gagal generate PDF. Silakan coba lagi.", "Failed to generate PDF. Please try again.");
      alert(msg);
    } finally {
      setLoading(false);
    }
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
      const response = await api.get(`/invoice/${item.id}/pdf`, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `INVOICE-${item.nomor_surat.replace(/\//g, "-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading invoice PDF:", error);
      alert(tr("Gagal mengunduh PDF.", "Failed to download PDF."));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(tr("Yakin ingin menghapus dokumen ini dari riwayat?", "Are you sure you want to delete this document from history?"))) {
      return;
    }
    try {
      await api.delete(`/invoice/${id}`);
      fetchHistory();
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await api.get(`/invoice/${item.id}`);
      const data = response.data.data;
      let itemDivisi = data.divisi;
      if (!itemDivisi && data.nomor_surat) {
        if (data.nomor_surat.includes("INV-DIVIT")) itemDivisi = "it";
        else if (data.nomor_surat.includes("INV-DIVSAL") || data.nomor_surat.includes("INV-DISAL")) itemDivisi = "sales";
        else if (data.nomor_surat.includes("INV-DIVSER")) itemDivisi = "service";
        else if (data.nomor_surat.includes("INV-DIVPRO") || data.nomor_surat.includes("INV-DIPRO")) itemDivisi = "bhp";
        else if (data.nomor_surat.includes("INV-DIVKON") || data.nomor_surat.includes("INV-DIKON")) itemDivisi = "kontraktor";
        else if (data.nomor_surat.includes("INV-DIVLOG") || data.nomor_surat.includes("INV-DILOG")) itemDivisi = "logistik";
        else if (data.nomor_surat.includes("INV-DIVPUR") || data.nomor_surat.includes("INV-DIPUR")) itemDivisi = "purchasing";
        else if (data.nomor_surat.includes("INV-DIVSIP") || data.nomor_surat.includes("INV-DISIP")) itemDivisi = "siplah";
      }

      const urutFromDoc = data.nomor_urut
        ? String(data.nomor_urut).padStart(3, "0")
        : (data.nomor_surat ? data.nomor_surat.split("/")[0] : "001");

      setFormData({
        divisi: itemDivisi || defaultDivisi || "it",
        nomor_urut: urutFromDoc,
        isNomorUrutCustom: true,
        tanggal_invoice: "",
        tanggal_invoice_display: data.tanggal_invoice || "",
        tanggal_jatuh_tempo: "",
        tanggal_jatuh_tempo_display: data.tanggal_jatuh_tempo || "",
        no_po: data.no_po || "",
        pakai_ttd: data.pakai_ttd !== false,
        pakai_cap: data.pakai_cap !== false,
        bill_to_nama: data.bill_to_nama || "",
        bill_to_alamat: data.bill_to_alamat || "",
        bill_to_telepon: data.bill_to_telepon || "",
        items: (data.items || []).map((it) => ({
          nama_item: it.nama_item || "",
          unit: it.unit || "pcs",
          qty: String(it.qty ?? 1),
          harga: nominalApiToInput(it.harga),
        })),
        diskon: nominalApiToInput(data.diskon_nominal),
        ppn_persen: String(data.ppn_persen ?? 11),
        catatan: data.catatan || DEFAULT_CATATAN,
        terms: data.terms || "",
        nama_penandatangan: data.nama_penandatangan || "SYAHRUL ROJI",
        jabatan_penandatangan: data.jabatan_penandatangan || "DIREKTUR",
      });
      setEditId(item.id);
      setEditNomorSurat(data.nomor_surat || item.nomor_surat || "");
      setIsEditing(true);
      setActiveTab("form");
      setShowViewModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error("Error fetching invoice detail:", error);
      alert(tr("Gagal memuat data untuk diedit", "Failed to load data for editing"));
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditId(null);
    setEditNomorSurat("");
    resetForm();
  };

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(Number(value || 0)));

  const estimatedSubtotal = formData.items.reduce((sum, item) => {
    return sum + parseRibuanId(item.harga) * Math.max(1, Number(item.qty || 1) || 1);
  }, 0);
  const estimatedDiskon = Math.min(estimatedSubtotal, parseRibuanId(formData.diskon));
  const estimatedDpp = Math.max(0, estimatedSubtotal - estimatedDiskon);
  const estimatedPpn = Math.round(estimatedDpp * (Number(formData.ppn_persen || 11) / 100));
  const estimatedTotal = estimatedDpp + estimatedPpn;

  const { filteredHistory, historyAllCount, historyProjectCount } = scopeDocumentHistory(
    historyData,
    searchTerm,
    (item, term) =>
      item.nomor_surat?.toLowerCase().includes(term) ||
      item.bill_to_nama?.toLowerCase().includes(term),
    activeTab,
    projekKerjaId
  );

  return {
    activeTab,
    setActiveTab,
    loading,
    fetchingNomor,
    nextNomorSurat,
    searchTerm,
    setSearchTerm,
    formData,
    filteredHistory,
    historyAllCount,
    historyProjectCount,
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
    formatRupiah,
    estimatedSubtotal,
    estimatedDiskon,
    estimatedPpn,
    estimatedTotal,
    isDuplicateNomor,
    handleSuggestNextNomor,
  };
};
