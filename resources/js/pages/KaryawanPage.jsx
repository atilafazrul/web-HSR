import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KaryawanPage() {

  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/karyawan");
      setEmployees(res.data);
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

      await axios.put(`/api/karyawan/${editData.id}`, editData);

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

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-white shadow rounded-xl hover:shadow-md transition"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>

          <div>
            <h2 className="text-2xl font-bold">
              Dashboard Profil Karyawan
            </h2>
            <p className="text-gray-500 text-sm">
              Kelola data lengkap seluruh karyawan
            </p>
          </div>
        </div>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition text-center"
          >

            <img
              src={
                emp.profile_photo
                  ? `/storage/${emp.profile_photo}`
                  : "/images/default-user.png"
              }
              className="w-32 h-32 mx-auto rounded-full border-4 border-purple-500 object-cover mb-5"
            />

            <h4 className="font-semibold text-lg">{emp.name}</h4>
            <p className="text-gray-500 mb-4">{emp.divisi || "-"}</p>

            <div className="flex justify-center gap-6">
              <Eye
                size={20}
                className="cursor-pointer text-blue-500 hover:scale-110"
                onClick={() => setSelected(emp)}
              />
              <Pencil
                size={20}
                className="cursor-pointer text-purple-600 hover:scale-110"
                onClick={() => setEditData({ ...emp })}
              />
            </div>

          </div>
        ))}
      </div>

      {/* VIEW MODAL */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h3 className="text-lg font-bold mb-4">Detail Karyawan</h3>

          <div className="space-y-2 text-sm">
            <p><b>NIK:</b> {selected.nik || "-"}</p>
            <p><b>Nama:</b> {selected.name || "-"}</p>
            <p><b>Tempat Lahir:</b> {selected.tempat_lahir || "-"}</p>
            <p><b>Tanggal Lahir:</b> {selected.tanggal_lahir || "-"}</p>
            <p><b>Alamat:</b> {selected.alamat || "-"}</p>
            <p><b>Jenis Kelamin:</b> {selected.jenis_kelamin || "-"}</p>
            <p><b>Agama:</b> {selected.agama || "-"}</p>
            <p><b>Status:</b> {selected.status_perkawinan || "-"}</p>
            <p><b>Pekerjaan:</b> {selected.pekerjaan || "-"}</p>

            <hr className="my-3" />

            <h4 className="font-semibold">Kontak Darurat</h4>
            <p><b>Nama:</b> {selected.kontak_darurat_nama || "-"}</p>
            <p><b>Hubungan:</b> {selected.kontak_darurat_hubungan || "-"}</p>
            <p><b>Telepon:</b> {selected.kontak_darurat_telepon || "-"}</p>
            <p><b>Alamat:</b> {selected.kontak_darurat_alamat || "-"}</p>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editData && (
        <Modal onClose={() => setEditData(null)}>
          <h3 className="text-lg font-bold mb-4">Edit Data</h3>

          <div className="max-h-[60vh] overflow-y-auto pr-2">

            {/* DATA DIRI */}
            <SectionTitle title="Data Diri" />

            {[
              "nik",
              "name",
              "tempat_lahir",
              "tanggal_lahir",
              "alamat",
              "jenis_kelamin",
              "agama",
              "status_perkawinan",
              "pekerjaan",
            ].map((field) => (
              <input
                key={field}
                value={editData[field] || ""}
                onChange={(e) =>
                  setEditData({ ...editData, [field]: e.target.value })
                }
                placeholder={field.replaceAll("_", " ")}
                className="border p-2 w-full mb-3 rounded text-sm"
              />
            ))}

            {/* KONTAK DARURAT */}
            <SectionTitle title="Kontak Darurat" />

            {[
              "kontak_darurat_nama",
              "kontak_darurat_hubungan",
              "kontak_darurat_telepon",
              "kontak_darurat_alamat",
            ].map((field) => (
              <input
                key={field}
                value={editData[field] || ""}
                onChange={(e) =>
                  setEditData({ ...editData, [field]: e.target.value })
                }
                placeholder={field.replaceAll("_", " ")}
                className="border p-2 w-full mb-3 rounded text-sm"
              />
            ))}

          </div>

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded mt-3 w-full"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>

        </Modal>
      )}

    </div>
  );
}


/* SECTION TITLE */
function SectionTitle({ title }) {
  return (
    <h4 className="font-semibold text-sm mt-4 mb-2 text-gray-600">
      {title}
    </h4>
  );
}


/* MODAL */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[500px] relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
}