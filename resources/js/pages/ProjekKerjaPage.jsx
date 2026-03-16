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
  Settings
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
  }, [currentDivisi]);

  const fetchData = async () => {

    try {

      const res = await api.get("/projek-kerja");

      let data = res.data.data || res.data || [];

      // Filter divisi dihilangkan agar semua divisi dapat melihat projek divisi lain
      // sesuai dengan instruksi.

      setDataList(data);

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

  return (
    <div className="space-y-12 p-6">

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
              <input
                value={divisiUser}
                disabled
                className="border p-3 rounded-xl bg-gray-100"
              />
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
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
              <option value="Terlambat">Terlambat</option>
            </select>

            <label
              htmlFor="uploadFile"
              className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-blue-50 transition cursor-pointer block"
            >

              <Upload className="mx-auto mb-1 text-blue-600" size={22} />

              <span className="font-semibold text-blue-700 text-sm block">
                Upload File
              </span>

              <span className="text-xs text-gray-500">
                {form.file ? form.file.name : "Choose file No file chosen"}
              </span>

              <input
                id="uploadFile"
                type="file"
                onChange={handleFileUpload}
                className="hidden"
              />

            </label>

            <label
              htmlFor="uploadFoto"
              className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-green-50 transition cursor-pointer block"
            >

              <Upload className="mx-auto mb-1 text-green-600" size={22} />

              <span className="font-semibold text-green-700 text-sm block">
                Upload Foto
              </span>

              <span className="text-xs text-gray-500">
                {form.photos.length > 0
                  ? `${form.photos.length} foto dipilih`
                  : "Choose files No file chosen"}
              </span>

              <input
                id="uploadFoto"
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />

            </label>

            <textarea
              name="problem_description"
              value={form.problem_description}
              onChange={handleChange}
              placeholder="Deskripsi"
              className="border p-3 rounded-xl md:col-span-2"
            />

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

      <div className="bg-white rounded-2xl shadow-md p-8 border">

        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">

          <Activity className="text-blue-600" />
          Data Projek Kerja

        </h2>

        <div className="overflow-x-auto">

          <table className="min-w-full text-sm">

            <thead className="bg-gray-100 text-gray-700">

              <tr className="text-left">

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <Building size={16} className="text-gray-400" />
                    Divisi
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <Briefcase size={16} className="text-gray-400" />
                    Tugas
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <User size={16} className="text-gray-400" />
                    Karyawan
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <MapPin size={16} className="text-gray-400" />
                    Lokasi
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <Calendar size={16} className="text-gray-400" />
                    Tanggal
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <FileText size={16} className="text-gray-400" />
                    Deskripsi
                  </div>
                </th>

                <th className="p-4 font-semibold">
                  <div className="flex items-center gap-2 opacity-80">
                    <Activity size={16} className="text-gray-400" />
                    Status
                  </div>
                </th>

                <th className="p-4 font-semibold text-center">
                  <div className="flex items-center justify-center gap-2 opacity-80">
                    <Settings size={16} className="text-gray-400" />
                    Aksi
                  </div>
                </th>

              </tr>

            </thead>

            <tbody>

              {dataList.map((item) => (

                <tr key={item.id} className="border-b hover:bg-gray-50 transition">

                  <td className="p-4 text-left">
                    {item.divisi}
                  </td>

                  <td className="p-4 font-medium text-left">
                    {item.jenis_pekerjaan}
                  </td>

                  <td className="p-4 text-left">
                    {item.karyawan}
                  </td>

                  <td className="p-4 text-left">
                    {item.alamat}
                  </td>

                  <td className="p-4 text-left">
                    {new Date(item.start_date).toLocaleDateString("id-ID")}
                  </td>

                  <td className="p-4 text-left">

                    {item.problem_description ? (

                      <button
                        onClick={() => {

                          setDescText(item.problem_description);
                          setNewDesc(item.problem_description);
                          setCurrentId(item.id);
                          setEditDesc(false);
                          setShowDesc(true);

                        }}
                        className="px-3 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100"
                      >

                        <Eye size={14} />
                        <span>Lihat</span>

                      </button>

                    ) : "-"}

                  </td>

                  <td className="p-4 text-left">

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

                  <td className="p-4">

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

                        <FileText size={16} />

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

      </div>

      {/* ================= MODAL DESKRIPSI ================= */}

      {showDesc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">

            <h3 className="text-xl font-bold mb-4">
              Deskripsi Pekerjaan
            </h3>

            {!editDesc ? (

              <>
                <p className="text-gray-700 whitespace-pre-line">
                  {descText || "-"}
                </p>

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    onClick={() => setEditDesc(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => setShowDesc(false)}
                    className="bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-lg"
                  >
                    Tutup
                  </button>

                </div>
              </>

            ) : (

              <>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="border w-full p-3 rounded-xl h-32"
                />

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    onClick={handleUpdateDesc}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Simpan
                  </button>

                  <button
                    onClick={() => setEditDesc(false)}
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

    </div>
  );
}