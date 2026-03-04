import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, Pencil, X, ArrowLeft, Search, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function KaryawanPage() {

  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editData, setEditData] = useState(null);
  const [createData, setCreateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* TAMBAHAN SEARCH */
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/api/karyawan");
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

  const handleCreate = async () => {
    try {
      setSaving(true);

      await axios.post("/api/karyawan", {
        ...createData,
        role: "admin",
        password: "123456"
      });

      alert("Karyawan berhasil ditambahkan ✅");
      setCreateData(null);
      fetchData();

    } catch (err) {
      console.error(err.response?.data || err.message);
      alert("Gagal menambahkan karyawan ❌");
    } finally {
      setSaving(false);
    }
  };

  /* TAMBAHAN DELETE */
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

  /* FILTER SEARCH */
  const filteredEmployees = employees.filter((emp) =>
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.divisi?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.nik?.includes(searchTerm)
  );

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-8 min-h-screen bg-gray-50">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

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

        {/* SEARCH */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-400"/>
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={searchTerm}
            onChange={(e)=>setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>

        <button
          onClick={() =>
            setCreateData({
              name: "",
              email: "",
              divisi: "",
            })
          }
          className="px-5 py-2 bg-purple-600 text-white rounded-xl shadow hover:bg-purple-700 transition"
        >
          + Tambah Karyawan
        </button>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition text-center"
          >

            {/* AVATAR AUTO */}
            <img
              src={
                emp.profile_photo
                  ? `/storage/${emp.profile_photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=8B5CF6&color=fff&size=128`
              }
              className="w-24 h-24 mx-auto rounded-full border-4 border-purple-200 object-cover mb-4"
              alt={emp.name}
            />

            <h4 className="font-semibold text-lg">{emp.name}</h4>
            <p className="text-gray-500 mb-4">{emp.divisi || "-"}</p>

            <div className="flex justify-center gap-4">

              <button
                onClick={() => setSelected(emp)}
                className="text-blue-600"
              >
                <Eye size={20}/>
              </button>

              <button
                onClick={() => setEditData({ ...emp })}
                className="text-purple-600"
              >
                <Pencil size={20}/>
              </button>

              <button
                onClick={() => handleDelete(emp.id)}
                className="text-red-600"
              >
                <Trash2 size={20}/>
              </button>

            </div>

          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center text-gray-500">
            Tidak ada data karyawan
          </div>
        )}

      </div>

      {/* VIEW MODAL */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>
          <h3 className="text-lg font-bold mb-4">Detail Karyawan</h3>

          <div className="space-y-2 text-sm">
            {Object.entries(selected).map(([key, value]) => (
              <p key={key}>
                <b>{key.replaceAll("_", " ")}:</b> {value || "-"}
              </p>
            ))}
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {editData && (
        <Modal onClose={() => setEditData(null)}>
          <h3 className="text-lg font-bold mb-4">Edit Data</h3>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            {Object.keys(editData).map((field) => (
              field !== "id" && (
                <input
                  key={field}
                  value={editData[field] || ""}
                  onChange={(e) =>
                    setEditData({ ...editData, [field]: e.target.value })
                  }
                  placeholder={field.replaceAll("_", " ")}
                  className="border p-2 w-full mb-3 rounded text-sm"
                />
              )
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

      {/* CREATE MODAL */}
      {createData && (
        <Modal onClose={() => setCreateData(null)}>
          <h3 className="text-lg font-bold mb-4">Tambah Karyawan</h3>

          <input
            value={createData.name}
            onChange={(e)=>setCreateData({...createData,name:e.target.value})}
            placeholder="Nama"
            className="border p-2 w-full mb-3 rounded text-sm"
          />

          <input
            value={createData.email}
            onChange={(e)=>setCreateData({...createData,email:e.target.value})}
            placeholder="Email"
            className="border p-2 w-full mb-3 rounded text-sm"
          />

          <select
            value={createData.divisi}
            onChange={(e)=>setCreateData({...createData,divisi:e.target.value})}
            className="border p-2 w-full mb-3 rounded text-sm"
          >
            <option value="">Pilih Divisi</option>
            <option value="IT">IT</option>
            <option value="Service">Service</option>
            <option value="Sales">Sales</option>
            <option value="Kontraktor">Kontraktor</option>
          </select>

          <button
            onClick={handleCreate}
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

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[500px] relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500"
        >
          <X size={20}/>
        </button>
        {children}
      </div>
    </div>
  );
}