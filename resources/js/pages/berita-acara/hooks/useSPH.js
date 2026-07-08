import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian } from "../utils/dateHelpers";
import { useDocumentSchedule } from "./useDocumentSchedule";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

const DEFAULT_PARAGRAF_PEMBUKA =
  "<p>Sehubungan dengan kebutuhan infrastruktur TI di perusahaan bapak/ibu, bersama ini kami dari PT. Hayati Semesta Raharja mengajukan penawaran sesuai dengan kebutuhan sistem di perusahaan bapak/ibu.</p><p>Berikut kami sampaikan rincian penawarannya:</p>";

const DEFAULT_SYARAT =
  "<ol><li>Harga belum termasuk PPN 11%.</li><li>Pembayaran dilakukan 100% setelah barang diterima.</li><li>Penawaran ini berlaku selama 30 (tiga puluh) hari dari tanggal penerbitan penawaran.</li></ol>";

const DEFAULT_PENUTUP =
  "<p>Untuk informasi lebih lanjut atau apabila terdapat hal yang ingin dikonsultasikan, Bapak/Ibu dapat menghubungi Nana Mahendra di nomor 0812-8722-2400.</p>";

export const useSPH = (projekKerjaId = null) => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [fetchingNomor, setFetchingNomor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [nextNomorSurat, setNextNomorSurat] = useState("");

  const {
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleSchedule,
    canSchedule,
  } = useDocumentSchedule(projekKerjaId, "sph");

  const [formData, setFormData] = useState({
    lampiran: "-",
    perihal: "Penawaran Harga",
    penerima_nama: "",
    paragraf_pembuka: DEFAULT_PARAGRAF_PEMBUKA,
    items: [{ nama_item: "", deskripsi: "", qty: "1", harga: "" }],
    kota_tanda_tangan: "Tangerang",
    tanggal_tanda_tangan: "",
    tanggal_tanda_tangan_display: "",
    nama_penandatangan: "Syahrul Roji",
    jabatan_penandatangan: "Direktur",
    syarat_ketentuan: DEFAULT_SYARAT,
    paragraf_penutup: DEFAULT_PENUTUP,
  });

  const buildSubmitData = () => ({
    lampiran: (formData.lampiran || "").trim() || "-",
    perihal: (formData.perihal || "").trim() || "Penawaran Harga",
    penerima_nama: formData.penerima_nama,
    paragraf_pembuka: formData.paragraf_pembuka,
    items: formData.items.map((item) => ({
      nama_item: item.nama_item,
      deskripsi: item.deskripsi,
      qty: item.qty,
      harga: Number(item.harga || 0),
    })),
    kota_tanda_tangan: (formData.kota_tanda_tangan || "").trim() || "Tangerang",
    tanggal_tanda_tangan:
      formData.tanggal_tanda_tangan_display ||
      formatDateToIndonesian(formData.tanggal_tanda_tangan),
    nama_penandatangan: (formData.nama_penandatangan || "").trim() || null,
    jabatan_penandatangan: (formData.jabatan_penandatangan || "").trim() || "Direktur",
    syarat_ketentuan: formData.syarat_ketentuan,
    paragraf_penutup: formData.paragraf_penutup,
  });

  useEffect(() => {
    if (activeTab === "form") {
      fetchNextNomorSurat();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (activeTab === "history") {
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
    const { name, value } = e.target;
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
    newItems[index][field] = value;
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
    setFormData({
      lampiran: "-",
      perihal: "Penawaran Harga",
      penerima_nama: "",
      paragraf_pembuka: DEFAULT_PARAGRAF_PEMBUKA,
      items: [{ nama_item: "", deskripsi: "", qty: "1", harga: "" }],
      kota_tanda_tangan: "Tangerang",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      nama_penandatangan: "Syahrul Roji",
      jabatan_penandatangan: "Direktur",
      syarat_ketentuan: DEFAULT_SYARAT,
      paragraf_penutup: DEFAULT_PENUTUP,
    });
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = buildSubmitData();
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

  const filteredHistory = historyData.filter(
    (item) =>
      item.nomor_surat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.penerima_nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(value || 0));

  const estimatedTotal = formData.items.reduce((sum, item) => {
    const harga = Number(item.harga || 0);
    const qty = Math.max(1, Number(String(item.qty || "1").replace(/\D/g, "")) || 1);
    return sum + harga * qty;
  }, 0);

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
    fetchHistory,
    scheduledAt,
    setScheduledAt,
    scheduling,
    handleScheduleGenerate,
    canSchedule,
    formatRupiah,
    estimatedTotal,
  };
};
