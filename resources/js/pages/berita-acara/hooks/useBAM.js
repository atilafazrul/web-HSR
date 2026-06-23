import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian, getDayName } from "../utils/dateHelpers";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

export const useBAM = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [fetchingNomor, setFetchingNomor] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  const [nextNomorSurat, setNextNomorSurat] = useState("");

  const [formData, setFormData] = useState({
    nama_hari: "",
    tanggal_bam: "",
    tanggal_bam_display: "",
    nama_klient: "",
    tanggal_tanda_tangan: "",
    tanggal_tanda_tangan_display: "",
    ttd_hsr: "",
    ttd_klien: "",
    nama_ttd_hsr: "",
    nama_ttd_klien: "",
    hasil: "BAIK",
    items: [{ nama_alat: "", merk: "", jumlah: "1" }],
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
      const response = await api.get("/bam/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/BAM-HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await api.get("/bam/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      const saved = localStorage.getItem("bam_history");
      if (saved) {
        try {
          setHistoryData(JSON.parse(saved));
        } catch (e) {
          console.error("Error parsing history:", e);
        }
      }
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "tanggal_bam") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tanggal_bam_display: formatDateToIndonesian(value),
        nama_hari: getDayName(value),
      }));
    } else if (name === "tanggal_tanda_tangan") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        tanggal_tanda_tangan_display: formatDateToIndonesian(value),
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { nama_alat: "", merk: "", jumlah: "1" }],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData((prev) => ({ ...prev, items: newItems }));
    }
  };

  const resetForm = () => {
    setFormData({
      nama_hari: "",
      tanggal_bam: "",
      tanggal_bam_display: "",
      nama_klient: "",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      ttd_hsr: "",
      ttd_klien: "",
      nama_ttd_hsr: "",
      nama_ttd_klien: "",
      hasil: "BAIK",
      items: [{ nama_alat: "", merk: "", jumlah: "1" }],
    });
    fetchNextNomorSurat();
  };

  const handleSignatureChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        nama_hari: formData.nama_hari,
        tanggal_bam:
          formData.tanggal_bam_display ||
          formatDateToIndonesian(formData.tanggal_bam),
        nama_klient: formData.nama_klient,
        tanggal_tanda_tangan:
          formData.tanggal_tanda_tangan_display ||
          formatDateToIndonesian(formData.tanggal_tanda_tangan),
        ttd_hsr: formData.ttd_hsr || null,
        ttd_klien: formData.ttd_klien || null,
        nama_ttd_hsr: (formData.nama_ttd_hsr || "").trim() || null,
        nama_ttd_klien: (formData.nama_ttd_klien || "").trim() || null,
        hasil: formData.hasil,
        items: formData.items,
      };

      const response = await api.post("/bam/pdf", submitData, {
        responseType: "blob",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/pdf",
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BAM-${nextNomorSurat.replace(/\//g, "-")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(
        `${tr("PDF BAM berhasil di-generate!", "BAM PDF generated successfully!")}\n${tr("Nomor Surat", "Letter Number")}: ${nextNomorSurat}`
      );
      resetForm();
      fetchNextNomorSurat();
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
      const response = await api.get(`/bam/${item.id}/pdf`, {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `BAM-${item.nomor_surat.replace(/\//g, "-")}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(tr("PDF BAM berhasil di-generate ulang!", "BAM PDF regenerated successfully!"));
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
        await api.delete(`/bam/${id}`);
        fetchHistory();
      } catch (error) {
        console.error("Error deleting:", error);
        const updatedHistory = historyData.filter((item) => item.id !== id);
        localStorage.setItem("bam_history", JSON.stringify(updatedHistory));
        setHistoryData(updatedHistory);
      }
    }
  };

  const filteredHistory = historyData.filter(
    (item) =>
      item.nomor_surat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nama_klient?.toLowerCase().includes(searchTerm.toLowerCase())
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
    handleInputChange,
    handleSignatureChange,
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
  };
};

