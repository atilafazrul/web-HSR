import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Download,
  Eye,
  Trash2,
  Briefcase,
  User,
  MapPin,
  Calendar,
  Upload,
  FileText,
  Building,
  Activity,
  Settings,
  ShoppingCart,
  Clock
} from "lucide-react";

export default function ProjekKerjaPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const divisiUser = user?.divisi;

  const getCurrentDivisi = () => {
    const pathSegments = location.pathname.split('/');
    const ProjekIndex = pathSegments.findIndex(seg => seg === 'projek');
    if (ProjekIndex > 0) {
      const divisiFromPath = pathSegments[ProjekIndex - 1];
      const divisiMap = {
        it: "IT",
        service: "Service",
        kontraktor: "Kontraktor",
        sales: "Sales",
        logistik: "Logistik",
        purchasing: "Purchasing"
      };
      return divisiMap[divisiFromPath.toLowerCase()] || divisiFromPath;
    }
    return null;
  };

  const currentDivisi = getCurrentDivisi();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const getDefaultDivisi = () => {
    if (role === "super_admin" && currentDivisi) {
      return currentDivisi;
    }
    return "";
  };

  const initialForm = {
    divisi: getDefaultDivisi(),
    jenis_pekerjaan: "",
    karyawan: "",
    alamat: "",
    status: "Dibuat",
    start_date: "",
    problem_description: "",
    barang_dibeli: "",
    file: null,
    photos: []
  };

  const [form, setForm] = useState(initialForm);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // State untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // jumlah item per halaman

  // Modal deskripsi
  const [showDesc, setShowDesc] = useState(false);
  const [descText, setDescText] = useState("");
  const [editDesc, setEditDesc] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newDesc, setNewDesc] = useState("");

  // Modal barang dibeli
  const [showBarangModal, setShowBarangModal] = useState(false);
  const [barangText, setBarangText] = useState("");
  const [editBarang, setEditBarang] = useState(false);
  const [newBarang, setNewBarang] = useState("");

  // Modal timeline status
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const api = axios.create({
    baseURL: "https://mansys.hsrsystem.com/api",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/projek-kerja");
      let data = res.data.data || res.data || [];
      // Urutkan berdasarkan id terbaru (descending)
      const sorted = data.sort((a, b) => b.id - a.id);
      setDataList(sorted);
      setCurrentPage(1); // reset ke halaman pertama setelah ambil data baru
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const handleChange = (e) => {
    setForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleFileUpload = (e) => {
    if (e.target.files[0]) {
      setForm(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      setForm(prev => ({ ...prev, photos: e.target.files }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (role !== "admin" && role !== "super_admin") {
      alert("Tidak ada akses");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries({
        divisi: role === "admin" ? divisiUser : form.divisi,
        jenis_pekerjaan: form.jenis_pekerjaan,
        karyawan: form.karyawan,
        alamat: form.alamat,
        status: form.status,
        start_date: form.start_date,
        problem_description: form.problem_description,
        barang_dibeli: form.barang_dibeli,
      }).forEach(([key, val]) => {
        formData.append(key, val || "");
      });

      if (form.file) formData.append("file", form.file);
      if (form.photos.length > 0) {
        Array.from(form.photos).forEach(photo => formData.append("photos[]", photo));
      }

      await api.post("/projek-kerja", formData);
      alert("Data berhasil disimpan");
      setForm(initialForm);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal simpan data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Dibuat": return "bg-gray-100 text-gray-700 border-gray-400";
      case "Persiapan": return "bg-blue-100 text-blue-700 border-blue-400";
      case "Proses Pekerjaan": return "bg-yellow-100 text-yellow-700 border-yellow-400";
      case "Editing": return "bg-purple-100 text-purple-700 border-purple-400";
      case "Invoicing": return "bg-indigo-100 text-indigo-700 border-indigo-400";
      case "Selesai": return "bg-green-100 text-green-700 border-green-400";
      default: return "bg-gray-100 text-gray-700 border-gray-400";
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/projek-kerja/${id}/status`, { status });
      fetchData();
    } catch {
      alert("Gagal update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin hapus project ini?")) return;
    try {
      await api.delete(`/projek-kerja/${id}`);
      fetchData();
    } catch {
      alert("Gagal hapus data");
    }
  };

  const handleViewPhoto = (id) => {
    const base = role === "super_admin" ? "/super_admin" : "/admin";
    navigate(`${base}/projek-kerja/foto/${id}`);
  };

  const handleUpdateDesc = async () => {
    try {
      await api.patch(`/projek-kerja/${currentId}/deskripsi`, {
        problem_description: newDesc
      });
      setDescText(newDesc);
      setEditDesc(false);
      setShowDesc(false);
      fetchData();
    } catch (err) {
      console.log(err.response);
      alert("Gagal update deskripsi");
    }
  };

  const handleUpdateBarang = async () => {
    if (!currentId) return;
    try {
      const item = dataList.find(i => i.id === currentId);
      if (!item) return;

      const formData = new FormData();
      formData.append('_method', 'PUT');
      formData.append('divisi', item.divisi);
      formData.append('jenis_pekerjaan', item.jenis_pekerjaan);
      formData.append('karyawan', item.karyawan);
      formData.append('alamat', item.alamat);
      formData.append('status', item.status);
      formData.append('start_date', item.start_date.split('T')[0]);
      formData.append('problem_description', item.problem_description);
      formData.append('barang_dibeli', newBarang);

      await api.post(`/projek-kerja/${currentId}`, formData);

      setBarangText(newBarang);
      setEditBarang(false);
      setShowBarangModal(false);
      fetchData();
    } catch (err) {
      console.error("Update barang error:", err.response?.data || err.message);
      alert("Gagal update barang: " + (err.response?.data?.message || err.message));
    }
  };

  const openTimelineModal = (item) => {
    setSelectedItem(item);
    setNewStatus(item.status);
    setShowTimelineModal(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedItem) return;
    await handleStatusChange(selectedItem.id, newStatus);
    setShowTimelineModal(false);
  };

  const renderTimelineStep = (label, isActive, date, isLast = false) => {
    return (
      <div className="flex items-start gap-3 relative">
        <div className="flex flex-col items-center">
          <div className={`w-5 h-5 rounded-full border-2 ${isActive ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`} />
          {!isLast && <div className="w-0.5 h-10 bg-gray-300 my-1" />}
        </div>
        <div className="pb-4">
          <p className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>{label}</p>
          {date && <p className="text-xs text-gray-400">{date}</p>}
        </div>
      </div>
    );
  };

  // Filter data berdasarkan pencarian
  const filteredData = dataList.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.divisi?.toLowerCase().includes(term) ||
      item.jenis_pekerjaan?.toLowerCase().includes(term) ||
      item.karyawan?.toLowerCase().includes(term) ||
      item.alamat?.toLowerCase().includes(term) ||
      item.status?.toLowerCase().includes(term) ||
      (item.barang_dibeli && item.barang_dibeli.toLowerCase().includes(term))
    );
  });

  // Pagination logic
  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  // Reset ke halaman pertama jika pencarian berubah
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-12 p-4 lg:p-6 w-full max-w-full overflow-x-hidden">

      {/* ================= FORM ================= */}
      {(role === "admin" || role === "super_admin") && (
        <div className="bg-white rounded-3xl shadow-xl border p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Briefcase className="text-blue-600" />
              Tambah Projek Kerja
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Tambahkan data projek kerja baru ke dalam sistem
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            encType="multipart/form-data"
          >
            {role === "super_admin" ? (
              <select
                name="divisi"
                value={form.divisi}
                onChange={handleChange}
                className="border p-3 rounded-xl focus:ring-2 focus:ring-blue-400"
                required
              >
                <option value="">Pilih Divisi</option>
                <option value="IT">IT</option>
                <option value="Service">Service</option>
                <option value="Kontraktor">Kontraktor</option>
                <option value="Sales">Sales</option>
                <option value="Logistik">Logistik</option>
                <option value="Purchasing">Purchasing</option>
              </select>
            ) : (
              <input value={divisiUser} disabled className="border p-3 rounded-xl bg-gray-100" />
            )}

            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="jenis_pekerjaan"
                value={form.jenis_pekerjaan}
                onChange={handleChange}
                placeholder="Jenis Pekerjaan"
                className="border pl-10 p-3 rounded-xl w-full"
                required
              />
            </div>

            <div className="relative">
              <User className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="karyawan"
                value={form.karyawan}
                onChange={handleChange}
                placeholder="Karyawan"
                className="border pl-10 p-3 rounded-xl w-full"
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                name="alamat"
                value={form.alamat}
                onChange={handleChange}
                placeholder="Lokasi"
                className="border pl-10 p-3 rounded-xl w-full"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                className="border pl-10 p-3 rounded-xl w-full"
                required
              />
            </div>

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border p-3 rounded-xl"
            >
              <option value="Dibuat">Dibuat</option>
              <option value="Persiapan">Persiapan</option>
              <option value="Proses Pekerjaan">Proses Pekerjaan</option>
              <option value="Editing">Editing</option>
              <option value="Invoicing">Invoicing</option>
              <option value="Selesai">Selesai</option>
            </select>

            <label
              htmlFor="uploadFile"
              className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-blue-50 transition cursor-pointer block"
            >
              <Upload className="mx-auto mb-1 text-blue-600" size={22} />
              <span className="font-semibold text-blue-700 text-sm block">Upload File</span>
              <span className="text-xs text-gray-500">
                {form.file ? form.file.name : "Choose file No file chosen"}
              </span>
              <input id="uploadFile" type="file" onChange={handleFileUpload} className="hidden" />
            </label>

            <label
              htmlFor="uploadFoto"
              className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-green-50 transition cursor-pointer block"
            >
              <Upload className="mx-auto mb-1 text-green-600" size={22} />
              <span className="font-semibold text-green-700 text-sm block">Upload Foto</span>
              <span className="text-xs text-gray-500">
                {form.photos.length > 0
                  ? `${form.photos.length} foto dipilih`
                  : "Choose files No file chosen"}
              </span>
              <input id="uploadFoto" type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>

            <textarea
              name="problem_description"
              value={form.problem_description}
              onChange={handleChange}
              placeholder="Deskripsi"
              className="border p-3 rounded-xl md:col-span-2"
            />

            {/* Barang Dibeli */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <ShoppingCart size={16} className="text-blue-600" />
                Barang yang Dibeli
              </label>
              <textarea
                name="barang_dibeli"
                value={form.barang_dibeli}
                onChange={handleChange}
                placeholder="Contoh: 2 pcs kabel HDMI, 1 unit monitor, dll."
                className="border p-3 rounded-xl w-full"
                rows={3}
              />
            </div>

            <button
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3 rounded-xl md:col-span-2 font-semibold shadow-lg transition"
            >
              {loading ? "Menyimpan..." : "Simpan Projek"}
            </button>
          </form>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-md p-4 lg:p-8 border" style={{ maxWidth: '100%' }}>
        {/* Header dengan judul dan search */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-blue-600" />
            Data Projek Kerja
          </h2>
          <div className="relative mt-2 sm:mt-0">
            <input
              type="text"
              placeholder="Cari divisi, tugas, karyawan, lokasi, status..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="border rounded-lg pl-10 pr-4 py-2 w-full sm:w-64 focus:ring-2 focus:ring-blue-400"
            />
            <svg
              className="absolute left-3 top-2.5 text-gray-400"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="w-full" style={{ overflowX: 'auto' }}>
          <table className="text-sm" style={{ minWidth: '1100px', width: '100%', tableLayout: 'fixed' }}>
            <thead className="bg-gray-100 text-gray-700">
              <tr className="text-left">
                <th className="p-2 font-semibold" style={{ width: '70px' }}>
                  <Building size={16} className="inline mr-1 text-gray-400" /> Divisi
                </th>
                <th className="p-2 font-semibold" style={{ width: '140px' }}>
                  <Briefcase size={16} className="inline mr-1 text-gray-400" /> Tugas
                </th>
                <th className="p-2 font-semibold" style={{ width: '110px' }}>
                  <User size={16} className="inline mr-1 text-gray-400" /> Karyawan
                </th>
                <th className="p-2 font-semibold" style={{ width: '140px' }}>
                  <MapPin size={16} className="inline mr-1 text-gray-400" /> Lokasi
                </th>
                <th className="p-2 font-semibold" style={{ width: '95px' }}>
                  <Calendar size={16} className="inline mr-1 text-gray-400" /> Tanggal
                </th>
                <th className="p-2 font-semibold" style={{ width: '90px' }}>
                  <FileText size={16} className="inline mr-1 text-gray-400" /> Deskripsi
                </th>
                {/* KOLOM BARANG DITAMBAHKAN */}
                <th className="p-2 font-semibold" style={{ width: '100px' }}>
                  <ShoppingCart size={16} className="inline mr-1 text-gray-400" /> Barang
                </th>
                <th className="p-2 font-semibold" style={{ width: '115px' }}>
                  <Activity size={16} className="inline mr-1 text-gray-400" /> Status
                </th>
                <th className="p-2 font-semibold text-center" style={{ width: '140px' }}>
                  <Settings size={16} className="inline mr-1 text-gray-400" /> Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                  <td className="p-2 truncate">{item.divisi}</td>
                  <td className="p-2 font-medium truncate">{item.jenis_pekerjaan}</td>
                  <td className="p-2 truncate">{item.karyawan}</td>
                  <td className="p-2 truncate">{item.alamat}</td>
                  <td className="p-2 whitespace-nowrap">{new Date(item.start_date).toLocaleDateString("id-ID")}</td>
                  <td className="p-2">
                    {item.problem_description ? (
                      <button
                        onClick={() => {
                          setDescText(item.problem_description);
                          setNewDesc(item.problem_description);
                          setCurrentId(item.id);
                          setEditDesc(false);
                          setShowDesc(true);
                        }}
                        className="px-2 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Lihat</span>
                      </button>
                    ) : "-"}
                  </td>
                  {/* KOLOM BARANG */}
                  <td className="p-2">
                    {item.barang_dibeli ? (
                      <button
                        onClick={() => {
                          setBarangText(item.barang_dibeli);
                          setNewBarang(item.barang_dibeli);
                          setCurrentId(item.id);
                          setEditBarang(false);
                          setShowBarangModal(true);
                        }}
                        className="px-2 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">Lihat</span>
                      </button>
                    ) : "-"}
                  </td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(item.status)} whitespace-nowrap inline-block max-w-full truncate`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-2">
                    <div className="flex justify-center gap-1">
                      {item.file_url && (
                        <a href={item.file_url} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg" title="Download File">
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={() => handleViewPhoto(item.id)} className="bg-green-600 hover:bg-green-700 text-white p-1.5 rounded-lg" title="Lihat Foto">
                        <FileText size={14} />
                      </button>
                      <button onClick={() => openTimelineModal(item)} className="bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-lg" title="Ubah Status">
                        <Clock size={14} />
                      </button>
                      {(role === "super_admin" || item.divisi === divisiUser) && (
                        <button onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg" title="Hapus">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredData.length === 0 && (
            <p className="text-center text-gray-500 py-8">Tidak ada data yang cocok</p>
          )}
        </div>

        {/* ================= PAGINATION ================= */}
        {filteredData.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-700">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} data
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                ← Prev
              </button>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL DESKRIPSI ================= */}
      {showDesc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-bold mb-4">Deskripsi Pekerjaan</h3>
            {!editDesc ? (
              <>
                <p className="text-gray-700 whitespace-pre-line">{descText || "-"}</p>
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={() => setEditDesc(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Edit</button>
                  <button onClick={() => setShowDesc(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Tutup</button>
                </div>
              </>
            ) : (
              <>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="border w-full p-3 rounded-xl h-32" />
                <div className="flex justify-end gap-3 mt-6">
                  <button onClick={handleUpdateDesc} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">Simpan</button>
                  <button onClick={() => setEditDesc(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">Batal</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL BARANG DIBELI ================= */}
      {showBarangModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <ShoppingCart className="text-blue-600" />
              Barang yang Dibeli
            </h3>
            {!editBarang ? (
              <>
                <p className="text-gray-700 whitespace-pre-line">{barangText}</p>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setNewBarang(barangText);
                      setEditBarang(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setShowBarangModal(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Tutup
                  </button>
                </div>
              </>
            ) : (
              <>
                <textarea
                  value={newBarang}
                  onChange={(e) => setNewBarang(e.target.value)}
                  className="border w-full p-3 rounded-xl h-32"
                  placeholder="Masukkan barang yang dibeli..."
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={handleUpdateBarang}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Simpan
                  </button>
                  <button
                    onClick={() => setEditBarang(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL TIMELINE STATUS ================= */}
      {showTimelineModal && selectedItem && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="text-blue-600" />
              Timeline Pekerjaan
            </h3>
            <div className="mb-6">
              <div className="ml-2">
                {renderTimelineStep("Dibuat", true, new Date(selectedItem.start_date).toLocaleString("id-ID"), false)}
                {renderTimelineStep(
                  "Persiapan",
                  ["Persiapan", "Proses Pekerjaan", "Editing", "Invoicing", "Selesai"].includes(selectedItem.status),
                  selectedItem.status === "Persiapan" ? "Sedang berjalan" : null,
                  false
                )}
                {renderTimelineStep(
                  "Proses Pekerjaan",
                  ["Proses Pekerjaan", "Editing", "Invoicing", "Selesai"].includes(selectedItem.status),
                  selectedItem.status === "Proses Pekerjaan" ? "Sedang berjalan" : null,
                  false
                )}
                {renderTimelineStep(
                  "Editing",
                  ["Editing", "Invoicing", "Selesai"].includes(selectedItem.status),
                  selectedItem.status === "Editing" ? "Sedang berjalan" : null,
                  false
                )}
                {renderTimelineStep(
                  "Invoicing",
                  ["Invoicing", "Selesai"].includes(selectedItem.status),
                  selectedItem.status === "Invoicing" ? "Sedang berjalan" : null,
                  false
                )}
                {renderTimelineStep(
                  "Selesai",
                  selectedItem.status === "Selesai",
                  selectedItem.status === "Selesai" ? new Date().toLocaleString("id-ID") : null,
                  true
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubah Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border p-2 rounded-lg w-full"
              >
                <option value="Dibuat">Dibuat</option>
                <option value="Persiapan">Persiapan</option>
                <option value="Proses Pekerjaan">Proses Pekerjaan</option>
                <option value="Editing">Editing</option>
                <option value="Invoicing">Invoicing</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={handleSaveStatus} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                Simpan Perubahan
              </button>
              <button onClick={() => setShowTimelineModal(false)} className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}