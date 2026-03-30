import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian, getDayName } from "../utils/dateHelpers";

export const useBAST = () => {
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
    tanggal_bast: "",
    tanggal_bast_display: "",
    nama_klient: "",
    tanggal_tanda_tangan: "",
    tanggal_tanda_tangan_display: "",
    hasil: "BAIK",
    items: [{ nama_alat: "", merk: "", jumlah: "1" }]
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
      const response = await api.get("/bast/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/BAST-HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await api.get("/bast/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      const saved = localStorage.getItem("bast_history");
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

    if (name === "tanggal_bast") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tanggal_bast_display: formatDateToIndonesian(value),
        nama_hari: getDayName(value)
      }));
    } else if (name === "tanggal_tanda_tangan") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tanggal_tanda_tangan_display: formatDateToIndonesian(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { nama_alat: "", merk: "", jumlah: "1" }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const resetForm = () => {
    setFormData({
      nama_hari: "",
      tanggal_bast: "",
      tanggal_bast_display: "",
      nama_klient: "",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      hasil: "BAIK",
      items: [{ nama_alat: "", merk: "", jumlah: "1" }]
    });
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        nama_hari: formData.nama_hari,
        tanggal_bast: formData.tanggal_bast_display || formatDateToIndonesian(formData.tanggal_bast),
        nama_klient: formData.nama_klient,
        tanggal_tanda_tangan: formData.tanggal_tanda_tangan_display || formatDateToIndonesian(formData.tanggal_tanda_tangan),
        hasil: formData.hasil,
        items: formData.items
      };

      const response = await api.post(
        "/bast/pdf",
        submitData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf'
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAST-${nextNomorSurat.replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(`PDF BAST berhasil di-generate!\nNomor Surat: ${nextNomorSurat}`);
      resetForm();
      fetchNextNomorSurat();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal generate PDF. Silakan coba lagi.");
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
      const response = await api.get(
        `/bast/${item.id}/pdf`,
        {
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf'
          }
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BAST-${item.nomor_surat.replace(/\//g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert("PDF BAST berhasil di-generate ulang!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal generate PDF. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Yakin ingin menghapus dokumen ini dari riwayat?")) {
      try {
        await api.delete(`/bast/${id}`);
        fetchHistory();
      } catch (error) {
        console.error("Error deleting:", error);
        const updatedHistory = historyData.filter(item => item.id !== id);
        localStorage.setItem("bast_history", JSON.stringify(updatedHistory));
        setHistoryData(updatedHistory);
      }
    }
  };

  const filteredHistory = historyData.filter(item =>
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
