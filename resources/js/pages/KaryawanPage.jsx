import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Eye,
  Pencil,
  X,
  ArrowLeft,
  Search,
  Trash2
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
        role: "admin"
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
    emp.nik?.includes(searchTerm)
  );

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="p-10 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10 flex-wrap gap-4">

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 bg-white shadow rounded-xl hover:shadow-lg transition"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div>
            <h2 className="text-3xl font-bold">
              Dashboard Profil Karyawan
            </h2>
            <p className="text-gray-500 text-sm">
              Kelola data lengkap seluruh karyawan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">

          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-2.5 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e)=>setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-xl text-sm w-[220px] bg-white shadow-sm focus:ring-2 focus:ring-purple-400 outline-none"
            />
          </div>

          <button
            onClick={() =>
              setCreateData({
                name: "",
                email: "",
                password: "",
                divisi: "",
              })
            }
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl shadow hover:scale-105 transition"
          >
            + Tambah Karyawan
          </button>

        </div>

      </div>

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

        {filteredEmployees.map((emp) => (

          <div
            key={emp.id}
            className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-300 text-center border border-gray-100"
          >

            {/* PHOTO */}
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

            {/* NAME */}
            <h4 className="font-semibold text-lg">{emp.name}</h4>

            <p className="text-gray-500 mb-5 text-sm">
              {emp.divisi || "-"}
            </p>

            {/* ACTION */}
            <div className="flex justify-center gap-4">

              <button
                onClick={() => setSelected(emp)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition"
              >
                <Eye size={18}/>
              </button>

              <button
                onClick={() => setEditData({ ...emp })}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-purple-50 hover:bg-purple-100 text-purple-600 transition"
              >
                <Pencil size={18}/>
              </button>

              <button
                onClick={() => handleDelete(emp.id)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 text-red-600 transition"
              >
                <Trash2 size={18}/>
              </button>

            </div>

          </div>

        ))}

      </div>

      {/* VIEW MODAL */}
      {selected && (
        <Modal onClose={() => setSelected(null)}>

          <div className="text-center mb-6">

            <img
              src={
                selected.profile_photo
                  ? `/storage/${selected.profile_photo}`
                  : `https://ui-avatars.com/api/?name=${encodeURIComponent(selected.name)}&background=8B5CF6&color=fff&size=128`
              }
              className="w-28 h-28 mx-auto rounded-full border-4 border-purple-200 object-cover mb-3"
            />

            <h3 className="text-xl font-bold">{selected.name}</h3>
            <p className="text-gray-500">{selected.divisi || "-"}</p>

          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="NIK" value={selected.nik}/>
            <Info label="Email" value={selected.email}/>
            <Info label="Phone" value={selected.phone}/>
            <Info label="Role" value={selected.role}/>
            <Info label="Tempat Lahir" value={selected.tempat_lahir}/>
            <Info label="Tanggal Lahir" value={selected.tanggal_lahir}/>
            <Info label="Alamat" value={selected.alamat}/>
            <Info label="Jenis Kelamin" value={selected.jenis_kelamin}/>
            <Info label="Agama" value={selected.agama}/>
            <Info label="Status Perkawinan" value={selected.status_perkawinan}/>
            <Info label="Pekerjaan" value={selected.pekerjaan}/>
            <Info label="Golongan Darah" value={selected.golongan_darah}/>
          </div>

        </Modal>
      )}

      {/* EDIT MODAL */}
      {editData && (
        <Modal onClose={() => setEditData(null)}>
          <h3 className="text-lg font-bold mb-4">Edit Data</h3>

          <div className="grid grid-cols-2 gap-4">

            <Input label="NIK" value={editData.nik}
              onChange={(v)=>setEditData({...editData,nik:v})}/>

            <Input label="Email" value={editData.email}
              onChange={(v)=>setEditData({...editData,email:v})}/>

            <Input label="Phone" value={editData.phone}
              onChange={(v)=>setEditData({...editData,phone:v})}/>

            <Input label="Tempat Lahir" value={editData.tempat_lahir}
              onChange={(v)=>setEditData({...editData,tempat_lahir:v})}/>

            <Input label="Tanggal Lahir" value={editData.tanggal_lahir}
              onChange={(v)=>setEditData({...editData,tanggal_lahir:v})}/>

            <Input label="Alamat" value={editData.alamat}
              onChange={(v)=>setEditData({...editData,alamat:v})}/>

            <Input label="Jenis Kelamin" value={editData.jenis_kelamin}
              onChange={(v)=>setEditData({...editData,jenis_kelamin:v})}/>

            <Input label="Agama" value={editData.agama}
              onChange={(v)=>setEditData({...editData,agama:v})}/>

            <Input label="Status Perkawinan" value={editData.status_perkawinan}
              onChange={(v)=>setEditData({...editData,status_perkawinan:v})}/>

            <Input label="Pekerjaan" value={editData.pekerjaan}
              onChange={(v)=>setEditData({...editData,pekerjaan:v})}/>

            <Input label="Golongan Darah" value={editData.golongan_darah}
              onChange={(v)=>setEditData({...editData,golongan_darah:v})}/>

          </div>

          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl mt-6 w-full"
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

          <input
            type="password"
            value={createData.password}
            onChange={(e)=>setCreateData({...createData,password:e.target.value})}
            placeholder="Password"
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

function Info({label,value}) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}

function Input({label,value,onChange}) {
  return (
    <div>
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <input
        value={value || ""}
        onChange={(e)=>onChange(e.target.value)}
        className="border p-2 w-full rounded text-sm"
      />
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-2xl w-[520px] relative shadow-2xl max-h-[90vh] overflow-y-auto">
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