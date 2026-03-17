import React, { useState, useEffect } from "react";
import { History, Plus, Search, Download, Eye, Trash2, FileText, Calendar } from "lucide-react";
import axios from "axios";

// Helper function to format date to Indonesian format
const formatDateToIndonesian = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const options = { day: 'numeric', month: 'long', year: 'numeric' };
  return date.toLocaleDateString('id-ID', options);
};

// Helper function to get day name from date
const getDayName = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
};

// Custom Hook untuk BAST
const useBAST = () => {
  const [activeTab, setActiveTab] = useState("form");
  const [loading, setLoading] = useState(false);
  const [fetchingNomor, setFetchingNomor] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [nextNomorSurat, setNextNomorSurat] = useState("");

  // Form state - dengan date picker dan hasil
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

  // Fetch next nomor surat saat komponen mount atau tab form aktif
  useEffect(() => {
    if (activeTab === "form") {
      fetchNextNomorSurat();
    }
  }, [activeTab]);

  // Fetch next nomor surat dari API
  const fetchNextNomorSurat = async () => {
    setFetchingNomor(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/bast/next-nomor");
      setNextNomorSurat(response.data.nomor_surat);
    } catch (error) {
      console.error("Error fetching nomor surat:", error);
      setNextNomorSurat("001/BAST-HSR/I/2026");
    } finally {
      setFetchingNomor(false);
    }
  };

  // Load history from API
  const fetchHistory = async () => {
    setFetchingHistory(true);
    try {
      const response = await axios.get("http://127.0.0.1:8000/api/bast/history");
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

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Jika input adalah tanggal, update juga display version dan nama hari
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
      // Prepare data for API - use display version for text
      const submitData = {
        nama_hari: formData.nama_hari,
        tanggal_bast: formData.tanggal_bast_display || formatDateToIndonesian(formData.tanggal_bast),
        nama_klient: formData.nama_klient,
        tanggal_tanda_tangan: formData.tanggal_tanda_tangan_display || formatDateToIndonesian(formData.tanggal_tanda_tangan),
        hasil: formData.hasil,
        items: formData.items
      };

      const response = await axios.post(
        "http://127.0.0.1:8000/api/bast/pdf",
        submitData,
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/pdf'
          }
        }
      );

      // Create blob link to download
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
      
      // Refresh nomor surat untuk dokumen berikutnya
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
      const response = await axios.get(
        `http://127.0.0.1:8000/api/bast/${item.id}/pdf`,
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
        await axios.delete(`http://127.0.0.1:8000/api/bast/${id}`);
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

// Form Component
const BASTForm = ({ 
  formData, 
  onInputChange, 
  onItemChange, 
  onAddItem, 
  onRemoveItem, 
  onSubmit, 
  onReset, 
  loading 
}) => {
  return (
    <div className="bg-white rounded-3xl shadow-md p-8">
      <form onSubmit={onSubmit}>
        {/* Informasi Utama */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 pb-2 border-b flex items-center gap-2">
            <FileText size={20} className="text-blue-600" />
            Informasi Dokumen
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hari - Auto from date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hari (Otomatis)
              </label>
              <input
                type="text"
                name="nama_hari"
                value={formData.nama_hari}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-100 text-gray-600 cursor-not-allowed"
                placeholder="Pilih tanggal terlebih dahulu"
              />
              <p className="text-xs text-gray-500 mt-1">Hari akan terisi otomatis dari tanggal pelaksanaan</p>
            </div>

            {/* Tanggal Pelaksanaan - Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  name="tanggal_bast"
                  value={formData.tanggal_bast}
                  onChange={onInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_bast_display && (
                <p className="text-sm text-gray-600 mt-1">
                  Format: {formData.tanggal_bast_display}
                </p>
              )}
            </div>

            {/* Tanggal Tanda Tangan - Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Tanda Tangan <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="date"
                  name="tanggal_tanda_tangan"
                  value={formData.tanggal_tanda_tangan}
                  onChange={onInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  required
                />
              </div>
              {formData.tanggal_tanda_tangan_display && (
                <p className="text-sm text-gray-600 mt-1">
                  Format: {formData.tanggal_tanda_tangan_display}
                </p>
              )}
            </div>

            {/* Nama Klien */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Klien <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama_klient"
                value={formData.nama_klient}
                onChange={onInputChange}
                placeholder="Contoh: RS Medika"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
            </div>

            {/* Hasil - Text Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasil Pemeriksaan <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="hasil"
                value={formData.hasil}
                onChange={onInputChange}
                placeholder="Contoh: BAIK, CUKUP, RUSAK, dll."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ketik hasil pemeriksaan/kondisi barang yang diserahkan
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Peralatan */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Daftar Peralatan
            </h3>
            <button
              type="button"
              onClick={onAddItem}
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Tambah Barang
            </button>
          </div>

          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 mb-4 items-end bg-gray-50 p-4 rounded-xl">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-500 mb-2">No</label>
                <div className="px-3 py-3 bg-white border border-gray-200 rounded-xl text-center font-semibold">
                  {index + 1}
                </div>
              </div>

              <div className="col-span-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Alat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.nama_alat}
                  onChange={(e) => onItemChange(index, 'nama_alat', e.target.value)}
                  placeholder="Contoh: C - ARM"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div className="col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Merk <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.merk}
                  onChange={(e) => onItemChange(index, 'merk', e.target.value)}
                  placeholder="Contoh: Siemens"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jumlah <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={item.jumlah}
                  onChange={(e) => onItemChange(index, 'jumlah', e.target.value)}
                  placeholder="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  required
                />
              </div>

              <div className="col-span-1">
                {formData.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveItem(index)}
                    className="px-3 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition w-full flex items-center justify-center"
                    title="Hapus barang"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onReset}
            className="px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`
              px-8 py-3 rounded-xl font-medium flex items-center gap-2
              transition-all duration-200
              ${loading
                ? 'bg-gray-400 cursor-not-allowed text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg'
              }
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <Download size={20} />
                Generate PDF
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// History Component
const BASTHistory = ({ 
  filteredHistory, 
  searchTerm, 
  onSearchChange, 
  onView, 
  onGeneratePDF, 
  onDelete,
  selectedItem,
  showViewModal,
  onCloseViewModal
}) => {
  const formatDate = (isoString) => {
    if (!isoString) return "-";
    const date = new Date(isoString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-md p-8">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Cari nomor surat atau nama klien..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
          />
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Belum ada dokumen BAST yang dibuat</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition bg-gray-50">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                      {item.nomor_surat}
                    </span>
                    <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded">
                      {item.hasil || 'BAIK'}
                    </span>
                  </div>
                  <h4 className="font-semibold text-lg text-gray-800">{item.nama_klient}</h4>
                  <p className="text-gray-500 text-sm mt-1">
                    {item.nama_hari}, {item.tanggal_bast}
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    {item.items?.length || 0} barang • Dibuat: {formatDate(item.created_at)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onView(item)}
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex items-center gap-1"
                    title="Lihat Detail"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => onGeneratePDF(item)}
                    className="px-3 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition flex items-center gap-1"
                    title="Download PDF"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(item.id)}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex items-center gap-1"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Detail BAST</h3>
              <button
                onClick={onCloseViewModal}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <label className="text-sm text-blue-600 font-medium">Nomor Surat</label>
                <p className="text-lg font-bold text-blue-800">{selectedItem.nomor_surat}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Klien</label>
                  <p className="font-medium">{selectedItem.nama_klient}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hasil</label>
                  <p className="font-medium text-green-600">{selectedItem.hasil || 'BAIK'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Hari</label>
                  <p className="font-medium">{selectedItem.nama_hari}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal BAST</label>
                  <p className="font-medium">{selectedItem.tanggal_bast}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tanggal Tanda Tangan</label>
                  <p className="font-medium">{selectedItem.tanggal_tanda_tangan}</p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500 mb-2 block">Daftar Peralatan</label>
                <table className="w-full text-sm border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-2 text-left border">No</th>
                      <th className="p-2 text-left border">Nama Alat</th>
                      <th className="p-2 text-left border">Merk</th>
                      <th className="p-2 text-left border">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItem.items?.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 border">{index + 1}</td>
                        <td className="p-2 border">{item.nama_alat}</td>
                        <td className="p-2 border">{item.merk}</td>
                        <td className="p-2 border">{item.jumlah}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onCloseViewModal}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  onGeneratePDF(selectedItem);
                  onCloseViewModal();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download size={16} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main Component
export default function BASTPage() {
  const {
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
  } = useBAST();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold">Generate BAST</h2>
          <p className="text-gray-500">
            Buat dan kelola dokumen Berita Acara Serah Terima
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("form")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "form"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <Plus size={18} />
          Buat Baru
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition ${
            activeTab === "history"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
        >
          <History size={18} />
          Riwayat ({filteredHistory.length})
        </button>
      </div>

      {/* Content */}
      <div className="animate-fadeIn">
        {activeTab === "form" ? (
          <BASTForm
            formData={formData}
            onInputChange={handleInputChange}
            onItemChange={handleItemChange}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onSubmit={handleSubmit}
            onReset={resetForm}
            loading={loading}
          />
        ) : (
          <BASTHistory
            filteredHistory={filteredHistory}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onView={handleView}
            onGeneratePDF={handleGeneratePDF}
            onDelete={handleDelete}
            selectedItem={selectedItem}
            showViewModal={showViewModal}
            onCloseViewModal={closeViewModal}
          />
        )}
      </div>
    </div>
  );
}
