import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { nominalApiToInput, parseRibuanId } from "../../../utils/formatRupiahInput";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

const DEFAULT_CATATAN = "<p>Pembayaran : 7641749137<br>BANK BCA a/n PT. HAYATI<br>SEMESTA RAHARJA</p>";
const DEFAULT_CATATAN_NON_PPN = "<p>Non PPN<br>Pembayaran : 8880253302<br>BANK BCA an SYAHRUL ROJI</p>";
const KNOWN_DEFAULT_CATATANS = [DEFAULT_CATATAN, DEFAULT_CATATAN_NON_PPN];

const formatDateEnglish = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const emptyItem = () => ({ nama_item: "", unit: "pcs", qty: "1", harga: "" });

export const useInvoice = (projekKerjaId = null) => {
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
    tanggal_invoice: "",
    tanggal_invoice_display: "",
    tanggal_jatuh_tempo: "",
    tanggal_jatuh_tempo_display: "",
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

  const buildSubmitData = () => ({
    tanggal_invoice: formData.tanggal_invoice_display || formatDateEnglish(formData.tanggal_invoice),
    tanggal_jatuh_tempo: formData.tanggal_jatuh_tempo_display || formatDateEnglish(formData.tanggal_jatuh_tempo) || null,
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
  });

  useEffect(() => {
    if (activeTab === "form" && !isEditing) fetchNextNomorSurat();
  }, [activeTab, formData.tanggal_invoice, isEditing]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchNextNomorSurat = async () => {
    setFetchingNomor(true);
    try {
      const params = formData.tanggal_invoice ? { tanggal_invoice: formData.tanggal_invoice } : {};
      const response = await api.get("/invoice/next-nomor", { params });
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor invoice:", error);
      setNextNomorSurat("1INV-DIVPRO/HSR/01012026");
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
    if (name === "tanggal_invoice") {
      setFormData((prev) => ({
        ...prev,
        tanggal_invoice: value,
        tanggal_invoice_display: formatDateEnglish(value),
      }));
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
      tanggal_invoice: "",
      tanggal_invoice_display: "",
      tanggal_jatuh_tempo: "",
      tanggal_jatuh_tempo_display: "",
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
        setActiveTab("history");
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
      link.setAttribute("download", `INVOICE-${nextNomorSurat.replace(/\//g, "-")}.pdf`);
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
      const msg = error?.response?.status === 403
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
      setFormData({
        tanggal_invoice: "",
        tanggal_invoice_display: data.tanggal_invoice || "",
        tanggal_jatuh_tempo: "",
        tanggal_jatuh_tempo_display: data.tanggal_jatuh_tempo || "",
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

  const filteredHistory = historyData.filter(
    (item) =>
      item.nomor_surat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bill_to_nama?.toLowerCase().includes(searchTerm.toLowerCase())
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
  };
};
