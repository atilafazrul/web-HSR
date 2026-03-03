import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, X, Search, Trash2 } from "lucide-react";

export default function KaryawanPage() {

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/karyawan");
      setEmployees(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await axios.put(`http://127.0.0.1:8000/api/karyawan/${editData.id}`, editData);
      alert("Data berhasil disimpan ✅");
      setEditData(null);
      fetchData();
    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Gagal menyimpan data ❌");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Yakin ingin menghapus data ini?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/karyawan/${id}`);
      alert("Data berhasil dihapus ✅");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data ❌");
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.divisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nik?.includes(searchTerm)
  );

  return (
    <div>

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Profil Karyawan</h2>
          <p className="text-gray-500 text-sm">Kelola data karyawan perusahaan</p>
        </div>

        <div className="flex items-center gap-3">
          {/* SEARCH */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div className="bg-white rounded-xl p-10 text-center">
          <div className="text-gray-500">Loading data karyawan...</div>
        </div>
      ) : (

        <>
          {/* EMPLOYEE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition text-center group"
              >

                <img
                  src={
                    emp.profile_photo
                      ? `http://127.0.0.1:8000/storage/${emp.profile_photo}`
                      : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=8B5CF6&color=fff&size=128`
                  }
                  className="w-24 h-24 mx-auto rounded-full border-4 border-blue-100 object-cover mb-4 group-hover:border-blue-300 transition"
                  alt={emp.name}
                />

                <h4 className="font-semibold text-gray-800">{emp.name || "-"}</h4>
                <p className="text-gray-500 text-sm mb-1">{emp.divisi || "-"}</p>
                <p className="text-gray-400 text-xs mb-4">{emp.nik || "-"}</p>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setSelected(emp)}
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title="Lihat Detail"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => setEditData({ ...emp })}
                    className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition"
                    title="Edit"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(emp.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

              </div>
            ))}

            {/* EMPTY STATE */}
            {filteredEmployees.length === 0 && (
              <div className="col-span-full bg-white rounded-xl p-10 text-center">
                <p className="text-gray-500">
                  {searchTerm ? "Tidak ditemukan karyawan dengan nama tersebut" : "Belum ada data karyawan"}
                </p>
              </div>
            )}

          </div>

          {/* VIEW MODAL */}
          {selected && (
            <Modal onClose={() => setSelected(null)}>
              <h3 className="text-lg font-bold mb-4">Detail Karyawan</h3>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <SectionTitle title="Data Diri" />

                {[
                  { field: "nik", label: "NIK" },
                  { field: "name", label: "Nama Lengkap" },
                  { field: "tempat_lahir", label: "Tempat Lahir" },
                  { field: "tanggal_lahir", label: "Tanggal Lahir" },
                  { field: "alamat", label: "Alamat" },
                  { field: "jenis_kelamin", label: "Jenis Kelamin" },
                  { field: "agama", label: "Agama" },
                  { field: "status_perkawinan", label: "Status Perkawinan" },
                  { field: "pekerjaan", label: "Pekerjaan" },
                ].map((item) => (
                  <DetailField
                    key={item.field}
                    label={item.label}
                    value={selected[item.field]}
                  />
                ))}

                <SectionTitle title="Kontak Darurat" />

                {[
                  { field: "kontak_darurat_nama", label: "Nama Kontak Darurat" },
                  { field: "kontak_darurat_hubungan", label: "Hubungan" },
                  { field: "kontak_darurat_telepon", label: "Telepon" },
                  { field: "kontak_darurat_alamat", label: "Alamat" },
                ].map((item) => (
                  <DetailField
                    key={item.field}
                    label={item.label}
                    value={selected[item.field]}
                  />
                ))}
              </div>
            </Modal>
          )}

          {/* EDIT MODAL */}
          {editData && (
            <Modal onClose={() => setEditData(null)}>
              <h3 className="text-lg font-bold mb-4">Edit Data Karyawan</h3>

              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <SectionTitle title="Data Diri" />

                {[
                  { field: "nik", label: "NIK" },
                  { field: "name", label: "Nama Lengkap" },
                  { field: "tempat_lahir", label: "Tempat Lahir" },
                  { field: "tanggal_lahir", label: "Tanggal Lahir", type: "date" },
                  { field: "alamat", label: "Alamat" },
                  { field: "jenis_kelamin", label: "Jenis Kelamin", select: ["Laki-laki", "Perempuan"] },
                  { field: "agama", label: "Agama" },
                  { field: "status_perkawinan", label: "Status Perkawinan" },
                  { field: "pekerjaan", label: "Pekerjaan" },
                ].map((item) => (
                  <FormField
                    key={item.field}
                    label={item.label}
                    value={editData[item.field] || ""}
                    onChange={(val) => setEditData({ ...editData, [item.field]: val })}
                    type={item.type}
                    select={item.select}
                  />
                ))}

                <SectionTitle title="Kontak Darurat" />

                {[
                  { field: "kontak_darurat_nama", label: "Nama Kontak Darurat" },
                  { field: "kontak_darurat_hubungan", label: "Hubungan" },
                  { field: "kontak_darurat_telepon", label: "Telepon" },
                  { field: "kontak_darurat_alamat", label: "Alamat" },
                ].map((item) => (
                  <FormField
                    key={item.field}
                    label={item.label}
                    value={editData[item.field] || ""}
                    onChange={(val) => setEditData({ ...editData, [item.field]: val })}
                  />
                ))}
              </div>

              <button
                onClick={handleUpdate}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg mt-4 w-full font-medium transition disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </Modal>
          )}

        </>
      )}
    </div>
  );
}

/* SECTION TITLE */
function SectionTitle({ title }) {
  return (
    <h4 className="font-bold text-base mt-4 mb-3 text-gray-800 uppercase tracking-wide">
      {title}
    </h4>
  );
}

/* DETAIL ROW */
function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800 text-right max-w-[60%]">{value || "-"}</span>
    </div>
  );
}

/* DETAIL FIELD - Mirip FormField tapi read-only */
function DetailField({ label, value }) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-800">
        {value || "-"}
      </div>
    </div>
  );
}

/* FORM FIELD */
function FormField({ label, value, onChange, type = "text", select }) {
  if (select) {
    return (
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="">Pilih {label.toLowerCase()}</option>
          {select.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
      />
    </div>
  );
}

/* MODAL */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start sm:items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-2xl w-full max-w-lg relative shadow-2xl animate-in fade-in zoom-in duration-200 my-4 sm:my-0 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition z-10"
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
}
