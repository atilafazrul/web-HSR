import { useState, useEffect } from "react";
import api from "../../../api/axiosConfig";
import { formatDateToIndonesian } from "../utils/dateHelpers";

const tr = (id, en) => {
  if (typeof window === "undefined") return id;
  return localStorage.getItem("app_language") === "en" ? en : id;
};

export const useSPPD = () => {
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

  const [formData, setFormData] = useState({
    pejabat_perintah: "",
    nama_pegawai: "",
    jabatan: "",
    tempat_berangkat: "",
    tempat_tujuan: "",
    transportasi: "",
    tanggal_berangkat: "",
    tanggal_berangkat_display: "",
    tanggal_kembali: "",
    tanggal_kembali_display: "",
    maksud: "",
    pengikut_nama: "",
    atas_beban: "Perjalanan Dinas",
    keterangan: "",
    dibuat_oleh: "",
    tanggal_tanda_tangan: "",
    tanggal_tanda_tangan_display: "",
    approve_nama: "",
    approve_jabatan: "",
    ttd_dibuat_oleh: "",
    ttd_menyetujui: "",
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
      const response = await api.get("/sppd/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/SPPD-HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await api.get("/sppd/history");
      setHistoryData(response.data.data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
      const saved = localStorage.getItem("sppd_history");
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

  const handleSignatureChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "tanggal_berangkat") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tanggal_berangkat_display: formatDateToIndonesian(value)
      }));
    } else if (name === "tanggal_kembali") {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        tanggal_kembali_display: formatDateToIndonesian(value)
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

  const resetForm = () => {
    setFormData({
      pejabat_perintah: "",
      nama_pegawai: "",
      jabatan: "",
      tempat_berangkat: "",
      tempat_tujuan: "",
      transportasi: "",
      tanggal_berangkat: "",
      tanggal_berangkat_display: "",
      tanggal_kembali: "",
      tanggal_kembali_display: "",
      maksud: "",
      pengikut_nama: "",
      atas_beban: "Perjalanan Dinas",
      keterangan: "",
      dibuat_oleh: "",
      tanggal_tanda_tangan: "",
      tanggal_tanda_tangan_display: "",
      approve_nama: "",
      approve_jabatan: "",
      ttd_dibuat_oleh: "",
      ttd_menyetujui: "",
    });
    fetchNextNomorSurat();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = {
        pejabat_perintah: formData.pejabat_perintah,
        nama_pegawai: formData.nama_pegawai,
        jabatan: formData.jabatan,
        tempat_berangkat: formData.tempat_berangkat,
        tempat_tujuan: formData.tempat_tujuan,
        transportasi: formData.transportasi,
        tanggal_berangkat: formData.tanggal_berangkat_display || formatDateToIndonesian(formData.tanggal_berangkat),
        tanggal_kembali: formData.tanggal_kembali_display || formatDateToIndonesian(formData.tanggal_kembali),
        maksud: formData.maksud,
        pengikut_nama: formData.pengikut_nama || null,
        atas_beban: formData.atas_beban,
        keterangan: formData.keterangan || null,
        dibuat_oleh: formData.dibuat_oleh,
        tanggal_tanda_tangan: formData.tanggal_tanda_tangan_display || formatDateToIndonesian(formData.tanggal_tanda_tangan),
        approve_nama: formData.approve_nama,
        approve_jabatan: formData.approve_jabatan,
        ttd_dibuat_oleh: formData.ttd_dibuat_oleh || null,
        ttd_menyetujui: formData.ttd_menyetujui || null,
      };

      let response;
      if (isEditing && editId) {
        response = await api.put(`/sppd/${editId}`, submitData);
      } else {
        response = await api.post("/sppd", submitData);
      }

      alert(
        isEditing
          ? tr("Dokumen SPPD berhasil diperbarui!", "SPPD document updated successfully!")
          : tr("Dokumen SPPD berhasil disimpan!", "SPPD document saved successfully!")
      );
      resetForm();
      setIsEditing(false);
      setEditId(null);
      setActiveTab("history");
      fetchHistory();
    } catch (error) {
      console.error("Error saving document:", error);
      alert(tr("Gagal menyimpan dokumen. Silakan coba lagi.", "Failed to save document. Please try again."));
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
        `/sppd/${item.id}/pdf`,
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
      link.setAttribute('download', 'SPPD-' + item.nomor_surat.replace(/\//g, '-') + '.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      alert(tr("PDF SPPD berhasil di-generate ulang!", "SPPD PDF regenerated successfully!"));
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
        await api.delete(`/sppd/${id}`);
        fetchHistory();
      } catch (error) {
        console.error("Error deleting:", error);
        const updatedHistory = historyData.filter(item => item.id !== id);
        localStorage.setItem("sppd_history", JSON.stringify(updatedHistory));
        setHistoryData(updatedHistory);
      }
    }
  };

  const handleEdit = async (item) => {
    try {
      const response = await api.get(`/sppd/${item.id}`);
      const data = response.data.data;

      // Parse date strings back to YYYY-MM-DD format for date inputs
      const parseDateToInput = (dateStr) => {
        if (!dateStr) return "";
        // If already in YYYY-MM-DD format
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
        // Parse Indonesian date format (e.g., "10 April 2026")
        const months = {
          'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
          'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
          'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
        };
        const parts = dateStr.split(' ');
        if (parts.length === 3) {
          const day = parts[0].padStart(2, '0');
          const month = months[parts[1]] || '01';
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
        return "";
      };

      setFormData({
        pejabat_perintah: data.pejabat_perintah || "",
        nama_pegawai: data.nama_pegawai || "",
        jabatan: data.jabatan || "",
        tempat_berangkat: data.tempat_berangkat || "",
        tempat_tujuan: data.tempat_tujuan || "",
        transportasi: data.transportasi || "",
        tanggal_berangkat: parseDateToInput(data.tanggal_berangkat),
        tanggal_berangkat_display: data.tanggal_berangkat || "",
        tanggal_kembali: parseDateToInput(data.tanggal_kembali),
        tanggal_kembali_display: data.tanggal_kembali || "",
        maksud: data.maksud || "",
        pengikut_nama: data.pengikut_nama || "",
        atas_beban: data.atas_beban || "Perjalanan Dinas",
        keterangan: data.keterangan || "",
        dibuat_oleh: data.dibuat_oleh || "",
        tanggal_tanda_tangan: parseDateToInput(data.tanggal_tanda_tangan),
        tanggal_tanda_tangan_display: data.tanggal_tanda_tangan || "",
        approve_nama: data.approve_nama || "",
        approve_jabatan: data.approve_jabatan || "",
        ttd_dibuat_oleh: data.ttd_dibuat_oleh || "",
        ttd_menyetujui: data.ttd_menyetujui || "",
      });

      setEditId(item.id);
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
    resetForm();
    fetchNextNomorSurat();
  };

  const filteredHistory = historyData.filter(item =>
    item.nomor_surat?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nama_pegawai?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tempat_tujuan?.toLowerCase().includes(searchTerm.toLowerCase())
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
    editId,
    handleInputChange,
    handleSignatureChange,
    resetForm,
    handleSubmit,
    handleView,
    closeViewModal,
    handleGeneratePDF,
    handleDelete,
    handleEdit,
    cancelEdit,
    fetchHistory,
  };
};