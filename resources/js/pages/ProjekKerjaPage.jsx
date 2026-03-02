import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Download, Eye, Trash2 } from "lucide-react";

export default function ProjekKerjaPage() {

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const divisiUser = user?.divisi;

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  const initialForm = {
    divisi: "",
    jenis_pekerjaan: "",
    karyawan: "",
    alamat: "",
    status: "Proses",
    start_date: "",
    problem_description: "",
    file: null,
    photos: []
  };

  const [form, setForm] = useState(initialForm);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showDesc, setShowDesc] = useState(false);
  const [descText, setDescText] = useState("");
  const [editDesc, setEditDesc] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [newDesc, setNewDesc] = useState("");

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get("/projek-kerja");
      let data = res.data;

      if (role === "admin") {
        data = data.filter(
          (item) => item.divisi === divisiUser
        );
      }

      setDataList(data);

    } catch (err) {
      console.error(err);
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
      setForm(prev => ({
        ...prev,
        file: e.target.files[0]
      }));
    }
  };

  const handlePhotoUpload = (e) => {
    if (e.target.files) {
      setForm(prev => ({
        ...prev,
        photos: e.target.files
      }));
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
      }).forEach(([key, val]) => {
        formData.append(key, val || "");
      });

      if (form.file) {
        formData.append("file", form.file);
      }

      if (form.photos.length > 0) {
        Array.from(form.photos).forEach(photo => {
          formData.append("photos[]", photo);
        });
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
    if (status === "Selesai")
      return "bg-green-100 text-green-700 border-green-400";
    if (status === "Terlambat")
      return "bg-red-100 text-red-700 border-red-400";
    return "bg-yellow-100 text-yellow-700 border-yellow-400";
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/projek-kerja/${id}/status`, { status });
      fetchData();
    } catch {
      alert("Gagal update status");
    }
  };

  const handleUpdateDesc = async () => {
    try {
      await api.patch(`/projek-kerja/${currentId}/deskripsi`, {
        problem_description: newDesc
      });

      alert("Deskripsi berhasil diupdate");
      setEditDesc(false);
      setShowDesc(false);
      fetchData();
    } catch {
      alert("Gagal update deskripsi");
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
    const base =
      role === "super_admin"
        ? "/super_admin"
        : "/admin";

    navigate(`${base}/projek-kerja/foto/${id}`);
  };

  return (
    <div className="space-y-12 p-6">

      {(role === "admin" || role === "super_admin") && (
        <div className="bg-white rounded-2xl shadow-lg p-8 border">

          <h2 className="text-2xl font-bold mb-6">
            📋 Tambah Projek Kerja
          </h2>

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
                className="border p-3 rounded-xl"
                required
              >
                <option value="">Pilih Divisi</option>
                <option value="IT">IT</option>
                <option value="Service">Service</option>
                <option value="Kontraktor">Kontraktor</option>
                <option value="Sales">Sales</option>
              </select>
            ) : (
              <input
                value={divisiUser}
                disabled
                className="border p-3 rounded-xl bg-gray-100"
              />
            )}

            <input
              name="jenis_pekerjaan"
              value={form.jenis_pekerjaan}
              onChange={handleChange}
              placeholder="Jenis Pekerjaan"
              className="border p-3 rounded-xl"
              required
            />

            <input
              name="karyawan"
              value={form.karyawan}
              onChange={handleChange}
              placeholder="Karyawan"
              className="border p-3 rounded-xl"
            />

            <input
              name="alamat"
              value={form.alamat}
              onChange={handleChange}
              placeholder="Lokasi"
              className="border p-3 rounded-xl"
            />

            <input
              type="date"
              name="start_date"
              value={form.start_date}
              onChange={handleChange}
              className="border p-3 rounded-xl"
              required
            />

            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="border p-3 rounded-xl"
            >
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
              <option value="Terlambat">Terlambat</option>
            </select>

            <div className="md:col-span-2 bg-blue-50 p-4 rounded-xl border">
              <label className="font-semibold text-sm text-blue-700">
                📄 Upload File
              </label>
              <input
                type="file"
                onChange={handleFileUpload}
                className="mt-2 w-full"
              />
            </div>

            <div className="md:col-span-2 bg-green-50 p-4 rounded-xl border">
              <label className="font-semibold text-sm text-green-700">
                🖼 Upload Foto
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="mt-2 w-full"
              />
            </div>

            <textarea
              name="problem_description"
              value={form.problem_description}
              onChange={handleChange}
              placeholder="Deskripsi"
              className="border p-3 rounded-xl md:col-span-2"
            />

            <button
              disabled={loading}
              className="bg-blue-600 text-white py-3 rounded-xl md:col-span-2"
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </button>

          </form>
        </div>
      )}

      {/* ================= TABLE UPDATED ================= */}

      <div className="bg-white rounded-2xl shadow-md p-8 border">

        <h2 className="text-2xl font-bold mb-6">
          📊 Data Projek Kerja
        </h2>

        <table className="min-w-full text-sm text-center">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Divisi</th>
              <th className="p-3">Tugas</th>
              <th className="p-3">Karyawan</th>
              <th className="p-3">Lokasi</th>
              <th className="p-3">Tanggal</th>
              <th className="p-3">Deskripsi</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>

          <tbody>
            {dataList.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">

                <td className="p-3">{item.divisi}</td>
                <td className="p-3 font-medium">{item.jenis_pekerjaan}</td>
                <td className="p-3">{item.karyawan}</td>
                <td className="p-3">{item.alamat}</td>

                <td className="p-3">
                  {new Date(item.start_date).toLocaleDateString("id-ID")}
                </td>

                <td className="p-3">
                  {item.problem_description ? (
                    <button
                      onClick={() => {
                        setDescText(item.problem_description);
                        setNewDesc(item.problem_description);
                        setCurrentId(item.id);
                        setEditDesc(false);
                        setShowDesc(true);
                      }}
                      className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs"
                    >
                      📄 Lihat
                    </button>
                  ) : "-"}
                </td>

                <td className="p-3">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      handleStatusChange(item.id, e.target.value)
                    }
                    className={`px-3 py-1 rounded-full text-xs border ${getStatusColor(item.status)}`}
                  >
                    <option value="Proses">Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Terlambat">Terlambat</option>
                  </select>
                </td>

                <td className="p-3">
                  <div className="flex justify-center gap-2">

                    {item.file_url && (
                      <a
                        href={item.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"
                      >
                        <Download size={16} />
                      </a>
                    )}

                    <button
                      onClick={() => handleViewPhoto(item.id)}
                      className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg"
                    >
                      <Eye size={16} />
                    </button>

                    {(role === "super_admin" ||
                      item.divisi === divisiUser) && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}

                  </div>
                </td>

              </tr>
            ))}
          </tbody>

        </table>

      </div>

      {/* MODAL tetap sama */}
      {showDesc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button
              onClick={() => setShowDesc(false)}
              className="absolute top-3 right-3 text-xl"
            >
              ✕
            </button>
            <h3 className="text-xl font-bold mb-4">
              📝 Detail Deskripsi
            </h3>
            <div className="border rounded-xl p-4 bg-gray-50 max-h-[300px] overflow-y-auto whitespace-pre-wrap">
              {descText}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}