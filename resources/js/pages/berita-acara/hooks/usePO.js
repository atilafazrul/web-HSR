import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian } from "../utils/dateHelpers";
import { nominalApiToInput, parseRibuanId } from "../../../utils/formatRupiahInput";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

const DEFAULT_SHIP_TO_NAMA = "PT. HAYATI SEMESTA RAHARJA";
const DEFAULT_SHIP_TO_ALAMAT =
  "<p>Jl Raya Pasar Kemis Kp Picung RT 04/05 No. 86<br>Ds Pasar Kemis Kec Pasar Kemis Kab Tangerang<br>Banten 15560</p>";

const emptyItem = () => ({ kode_item: "", deskripsi: "", qty: "1", harga: "" });

export const usePO = (projekKerjaId = null) => {
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

  const [formData, setFormData] = useState({
    tanggal_po: "",
    tanggal_po_display: "",
    to_nama: "",
    to_alamat: "",
    ship_to_nama: DEFAULT_SHIP_TO_NAMA,
    ship_to_alamat: DEFAULT_SHIP_TO_ALAMAT,
    fob: "",
    shipped_via: "",
    payment_term: "Cash On Delivery",
    diskon: "",
    ppn_persen: "11",
    items: [emptyItem()],
    catatan: "",
    kota_tanda_tangan: "Tangerang",
    nama_penandatangan: "Syahrul Roji",
    jabatan_penandatangan: "",
  });

  const buildSubmitData = () => ({
    tanggal_po: formData.tanggal_po_display || formatDateToIndonesian(formData.tanggal_po),
    to_nama: formData.to_nama,
    to_alamat: formData.to_alamat,
    ship_to_nama: formData.ship_to_nama,
    ship_to_alamat: formData.ship_to_alamat,
    fob: formData.fob,
    shipped_via: formData.shipped_via,
    payment_term: formData.payment_term,
    diskon_nominal: parseRibuanId(formData.diskon),
    ppn_persen: Number(formData.ppn_persen || 11),
    items: formData.items.map((item) => ({
      kode_item: item.kode_item,
      deskripsi: item.deskripsi,
      qty: Math.max(1, Number(item.qty || 1) || 1),
      harga: parseRibuanId(item.harga),
    })),
    catatan: formData.catatan,
    kota_tanda_tangan: (formData.kota_tanda_tangan || "").trim() || "Tangerang",
    nama_penandatangan: (formData.nama_penandatangan || "").trim() || "Syahrul Roji",
    jabatan_penandatangan: (formData.jabatan_penandatangan || "").trim() || null,
    ...(projekKerjaId ? { projek_kerja_id: Number(projekKerjaId) } : {}),
  });

  useEffect(() => {
    if (activeTab === "form") fetchNextNomorSurat();
  }, [activeTab]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "history") fetchHistory();
  }, [activeTab]);

  const fetchNextNomorSurat = async () => {
    setFetchingNomor(true);
    try {
      const response = await api.get("/po/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/BHP/HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await api.get("/po/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "tanggal_po") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tanggal_po_display: formatDateToIndonesian(value),
      }));
    } else if (name === "diskon") {
      setFormData((prev) => ({ ...prev, diskon: value }));
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
      tanggal_po: "",
      tanggal_po_display: "",
      to_nama: "",
      to_alamat: "",
      ship_to_nama: DEFAULT_SHIP_TO_NAMA,
      ship_to_alamat: DEFAULT_SHIP_TO_ALAMAT,
      fob: "",
      shipped_via: "",
      payment_term: "Cash On Delivery",
      diskon: "",
      ppn_persen: "11",
      items: [emptyItem()],
      catatan: "",
      kota_tanda_tangan: "Tangerang",
      nama_penandatangan: "Syahrul Roji",
      jabatan_penandatangan: "",
    });
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = buildSubmitData();

      if (isEditing && editId) {
        await api.put(`/po/${editId}`, submitData);
        alert(tr("Dokumen PO berhasil diperbarui!", "PO document updated successfully!"));
        setIsEditing(false);
        setEditId(null);
        setEditNomorSurat("");
        resetForm();
        setActiveTab("history");
        fetchHistory();
        return;
      }

      const response = await api.post("/po/pdf", submitData, {
        responseType: "blob",
        headers: { "Content-Type": "application/json", Accept: "application/pdf" },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PO-${nextNomorSurat.replace(/\//g, "-")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(tr("PDF PO berhasil di-generate!", "PO PDF generated successfully!"));
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
      const response = await api.get(`/po/${item.id}/pdf`, {
        responseType: "blob",
        headers: { Accept: "application/pdf" },
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `PO-${item.nomor_surat.replace(/\//g, "-")}.pdf`);
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
    if (!window.confirm(tr("Yakin ingin menghapus dokumen ini dari riwayat?", "Are you sure you want to delete this document from history?"))) {
      return;
    }
    try {
      await api.delete(`/po/${id}`);
      fetchHistory();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await api.get(`/po/${item.id}`);
      const data = response.data.data;
      setFormData({
        tanggal_po: "",
        tanggal_po_display: data.tanggal_po || "",
        to_nama: data.to_nama || "",
        to_alamat: data.to_alamat || "",
        ship_to_nama: data.ship_to_nama || DEFAULT_SHIP_TO_NAMA,
        ship_to_alamat: data.ship_to_alamat || DEFAULT_SHIP_TO_ALAMAT,
        fob: data.fob || "",
        shipped_via: data.shipped_via || "",
        payment_term: data.payment_term || "Cash On Delivery",
        diskon: nominalApiToInput(data.diskon_nominal),
        ppn_persen: String(data.ppn_persen ?? 11),
        items: (data.items || []).map((it) => ({
          kode_item: it.kode_item || "",
          deskripsi: it.deskripsi || "",
          qty: String(it.qty ?? 1),
          harga: nominalApiToInput(it.harga),
        })),
        catatan: data.catatan || "",
        kota_tanda_tangan: data.kota_tanda_tangan || "Tangerang",
        nama_penandatangan: data.nama_penandatangan || "Syahrul Roji",
        jabatan_penandatangan: data.jabatan_penandatangan || "",
      });
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
      item.to_nama?.toLowerCase().includes(searchTerm.toLowerCase())
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
    historyData,
    filteredHistory,
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
    formatRupiah,
    estimatedSubtotal,
    estimatedDiskon,
    estimatedPpn,
    estimatedTotal,
  };
};
