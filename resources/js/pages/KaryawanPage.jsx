import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  X,
  Search,
  Trash2,
  UserPlus,
  Save,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KaryawanPage() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [createData, setCreateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      const res = await axios.get("/api/karyawan");
      setEmployees(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data karyawan");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date for input type="date"
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse and format
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Hanya kirim field yang memiliki nilai
      const payload = {};
      
      // Daftar field yang bisa diupdate
      const fields = [
        'name', 'nik', 'email', 'phone', 'no_telepon', 'alamat',
        'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'agama',
        'status_perkawinan', 'pekerjaan', 'golongan_darah',
        'kontak_darurat_nama', 'kontak_darurat_hubungan', 
        'kontak_darurat_telepon', 'kontak_darurat_alamat'
      ];
      
      fields.forEach(field => {
        if (editData[field] !== undefined && editData[field] !== null && editData[field] !== '') {
          payload[field] = editData[field];
        }
      });

      console.log("Mengirim payload:", payload);

      const res = await axios.put(`/api/karyawan/${editData.id}`, payload);
      
      console.log("Response:", res.data);
      alert("Data berhasil disimpan ✅");
      setEditData(null);
      fetchData();
      
    } catch (err) {
      console.error("Error response:", err.response?.data);
      
      // Tampilkan error detail
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join("\n");
        alert(`Gagal menyimpan:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || "Gagal menyimpan data ❌");
      }
      
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      // Validasi sederhana
      if (!createData.name || !createData.email || !createData.password) {
        alert("Nama, Email, dan Password harus diisi!");
        setSaving(false);
        return;
      }

      await axios.post("/api/karyawan", {
        ...createData,
        role: "admin" // Set default role
      });

      alert("Karyawan berhasil ditambahkan ✅");
      setCreateData(null);
      fetchData();

    } catch (err) {
      console.error(err.response?.data || err.message);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join("\n");
        alert(`Gagal menambahkan:\n${errorMessages}`);
      } else {
        alert(err.response?.data?.message || "Gagal menambahkan karyawan ❌");
      }
      
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus karyawan ini?")) return;

    try {
      await axios.delete(`/api/karyawan/${id}`);
      alert("Karyawan berhasil dihapus ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus karyawan ❌");
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.divisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nik?.includes(searchTerm) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-10 flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-10 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 bg-clip-text text-transparent">
            Dashboard Profil Karyawan
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data lengkap seluruh karyawan
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">

          {/* Search */}
          <div className="relative flex-1 sm:flex-none">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border rounded-xl text-sm w-full sm:w-[250px] bg-white shadow-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() =>
              setCreateData({
                name: "",
                email: "",
                password: "",
                divisi: "",
              })
            }
            className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <UserPlus size={18} />
            <span className="hidden sm:inline">Tambah Karyawan</span>
          </button>

        </div>

      </div>

      {/* GRID KARYAWAN */}
      {filteredEmployees.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow">
          <p className="text-gray-500">Tidak ada data karyawan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center border border-gray-100"
            >
              <div className="relative mb-4">
                <img
                  src={
                    emp.profile_photo
                      ? `/storage/${emp.profile_photo}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=8B5CF6&color=fff&size=128`
                  }
                  className="w-24 h-24 mx-auto rounded-full border-4 border-purple-200 object-cover"
                  alt={emp.name}
                />
              </div>

              <h4 className="font-semibold text-lg truncate">{emp.name}</h4>
              <p className="text-gray-500 mb-2 text-sm">{emp.divisi || "-"}</p>
              <p className="text-gray-400 mb-4 text-xs">{emp.email}</p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setSelected(emp)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
                  title="Lihat Detail"
                >
                  <Eye size={16} />
                </button>

                <button
                  onClick={() => {
                    // Format tanggal lahir untuk input
                    const formattedData = {
                      ...emp,
                      tanggal_lahir: formatDateForInput(emp.tanggal_lahir)
                    };
                    setEditData(formattedData);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 transition"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>

                <button
                  onClick={() => handleDelete(emp.id)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition"
                  title="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DETAIL */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title="Detail Karyawan">
          <div className="text-center mb-6">
            <img
              src={
                selected.profile_photo
                  ? `/storage/${selected.profile_photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&background=8B5CF6&color=fff&size=128`
              }
              className="w-28 h-28 mx-auto rounded-full border-4 border-purple-200 object-cover mb-3"
              alt={selected.name}
            />
            <h3 className="text-xl font-bold">{selected.name}</h3>
            <p className="text-gray-500">{selected.divisi || "-"}</p>
          </div>

          <div className="space-y-4">
            {/* Data Pribadi */}
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Data Pribadi</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="NIK" value={selected.nik} />
                <Info label="Email" value={selected.email} />
                <Info label="No. Telepon" value={selected.phone || selected.no_telepon} />
                <Info label="Tempat Lahir" value={selected.tempat_lahir} />
                <Info label="Tanggal Lahir" value={selected.tanggal_lahir ? new Date(selected.tanggal_lahir).toLocaleDateString('id-ID') : "-"} />
                <Info label="Alamat" value={selected.alamat} />
                <Info label="Jenis Kelamin" value={selected.jenis_kelamin} />
                <Info label="Agama" value={selected.agama} />
                <Info label="Status Perkawinan" value={selected.status_perkawinan} />
                <Info label="Pekerjaan" value={selected.pekerjaan} />
                <Info label="Golongan Darah" value={selected.golongan_darah} />
              </div>
            </div>

            {/* Kontak Darurat */}
            <div>
              <h4 className="font-semibold text-purple-700 mb-2">Kontak Darurat</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <Info label="Nama Kontak Darurat" value={selected.kontak_darurat_nama} />
                <Info label="Hubungan" value={selected.kontak_darurat_hubungan} />
                <Info label="Telepon Kontak Darurat" value={selected.kontak_darurat_telepon} />
                <Info label="Alamat Kontak Darurat" value={selected.kontak_darurat_alamat} />
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL EDIT */}
      {editData && (
        <Modal onClose={() => setEditData(null)} title="Edit Data Karyawan">
          <div className="space-y-6">
            {/* Data Pribadi */}
            <div>
              <h4 className="font-semibold text-purple-700 mb-3">Data Pribadi</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Nama Lengkap" 
                  value={editData.name}
                  onChange={(v) => setEditData({ ...editData, name: v })} 
                  required
                />

                <Input 
                  label="NIK" 
                  value={editData.nik}
                  onChange={(v) => setEditData({ ...editData, nik: v })} 
                />

                <Input 
                  label="Email" 
                  type="email"
                  value={editData.email}
                  onChange={(v) => setEditData({ ...editData, email: v })} 
                  required
                />

                <Input 
                  label="Nomor Telepon" 
                  value={editData.phone || editData.no_telepon}
                  onChange={(v) => {
                    setEditData({ 
                      ...editData, 
                      phone: v,
                      no_telepon: v 
                    });
                  }} 
                />

                <Input 
                  label="Tempat Lahir" 
                  value={editData.tempat_lahir}
                  onChange={(v) => setEditData({ ...editData, tempat_lahir: v })} 
                />

                <Input 
                  label="Tanggal Lahir" 
                  type="date"
                  value={editData.tanggal_lahir || ""}
                  onChange={(v) => setEditData({ ...editData, tanggal_lahir: v })} 
                />

                <div className="col-span-2">
                  <Input 
                    label="Alamat" 
                    value={editData.alamat}
                    onChange={(v) => setEditData({ ...editData, alamat: v })} 
                  />
                </div>

                <Select
                  label="Jenis Kelamin"
                  value={editData.jenis_kelamin}
                  onChange={(v) => setEditData({ ...editData, jenis_kelamin: v })}
                  options={[
                    { value: "", label: "Pilih Jenis Kelamin" },
                    { value: "Laki-laki", label: "Laki-laki" },
                    { value: "Perempuan", label: "Perempuan" }
                  ]}
                />

                <Input 
                  label="Agama" 
                  value={editData.agama}
                  onChange={(v) => setEditData({ ...editData, agama: v })} 
                />

                <Select
                  label="Status Perkawinan"
                  value={editData.status_perkawinan}
                  onChange={(v) => setEditData({ ...editData, status_perkawinan: v })}
                  options={[
                    { value: "", label: "Pilih Status" },
                    { value: "Belum Kawin", label: "Belum Kawin" },
                    { value: "Kawin", label: "Kawin" },
                    { value: "Cerai", label: "Cerai" },
                    { value: "Cerai Mati", label: "Cerai Mati" }
                  ]}
                />

                <Input 
                  label="Pekerjaan" 
                  value={editData.pekerjaan}
                  onChange={(v) => setEditData({ ...editData, pekerjaan: v })} 
                />

                <Select
                  label="Golongan Darah"
                  value={editData.golongan_darah}
                  onChange={(v) => setEditData({ ...editData, golongan_darah: v })}
                  options={[
                    { value: "", label: "Pilih Golongan" },
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "AB", label: "AB" },
                    { value: "O", label: "O" }
                  ]}
                />
              </div>
            </div>

            {/* Kontak Darurat */}
            <div>
              <h4 className="font-semibold text-purple-700 mb-3">Kontak Darurat</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Nama Kontak Darurat" 
                  value={editData.kontak_darurat_nama}
                  onChange={(v) => setEditData({ ...editData, kontak_darurat_nama: v })} 
                />

                <Input 
                  label="Hubungan" 
                  value={editData.kontak_darurat_hubungan}
                  onChange={(v) => setEditData({ ...editData, kontak_darurat_hubungan: v })} 
                />

                <Input 
                  label="Telepon Kontak Darurat" 
                  value={editData.kontak_darurat_telepon}
                  onChange={(v) => setEditData({ ...editData, kontak_darurat_telepon: v })} 
                />

                <div className="col-span-2">
                  <Input 
                    label="Alamat Kontak Darurat" 
                    value={editData.kontak_darurat_alamat}
                    onChange={(v) => setEditData({ ...editData, kontak_darurat_alamat: v })} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              onClick={() => setEditData(null)}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL CREATE */}
      {createData && (
        <Modal onClose={() => setCreateData(null)} title="Tambah Karyawan Baru">
          <div className="space-y-4">
            <Input 
              label="Nama Lengkap" 
              value={createData.name}
              onChange={(v) => setCreateData({ ...createData, name: v })} 
              required
              placeholder="Masukkan nama lengkap"
            />

            <Input 
              label="Email" 
              type="email"
              value={createData.email}
              onChange={(v) => setCreateData({ ...createData, email: v })} 
              required
              placeholder="contoh@email.com"
            />

            <Input 
              label="Password" 
              type="password"
              value={createData.password}
              onChange={(v) => setCreateData({ ...createData, password: v })} 
              required
              placeholder="Minimal 6 karakter"
            />

            <Select
              label="Divisi"
              value={createData.divisi}
              onChange={(v) => setCreateData({ ...createData, divisi: v })}
              options={[
                { value: "", label: "Pilih Divisi" },
                { value: "IT", label: "IT" },
                { value: "Service", label: "Service" },
                { value: "Sales", label: "Sales" },
                { value: "Kontraktor", label: "Kontraktor" }
              ]}
            />
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-xl hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UserPlus size={18} />
              {saving ? "Menyimpan..." : "Tambah Karyawan"}
            </button>
            <button
              onClick={() => setCreateData(null)}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
            >
              Batal
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

// ================= COMPONENTS =================

function Info({ label, value }) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-medium break-words">{value || "-"}</p>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, required }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </p>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border p-2.5 w-full rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none transition"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="border p-2.5 w-full rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none transition bg-white"
      >
        {options.map((opt, idx) => (
          <option key={idx} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({ children, onClose, title }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl w-full max-w-3xl relative shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}