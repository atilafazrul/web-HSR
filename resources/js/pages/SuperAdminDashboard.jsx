import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  Eye,
  Trash2,
  Building,
  Briefcase,
  User,
  MapPin,
  Calendar,
  FileText,
  Activity,
  Settings
} from "lucide-react";

import axios from "axios";

/* PAGES */
import Profile from "./Profile.jsx";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

import ITPage from "./ITPage";
import InventoryPage from "./InventoryPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import FormBarangPage from "./FormBarangPage";
import EditBarangPage from "./EditBarangPage";
import GeneratePDFPage from "./GeneratePDFPage";
import KaryawanPage from "./KaryawanPage";
import TargetPage from "./TargetPage";

/* ================= MAIN ================= */

export default function SuperAdminDashboard({ user, logout }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("projek-kerja/foto")) return "Kelola Foto & dokumen";
    if (path.includes("projek-kerja")) return "Projek Kerja";
    if (path.includes("/it/buat-pdf")) return "Buat PDF - IT";
    if (path.includes("/service/buat-pdf")) return "Buat PDF - Service";
    if (path.includes("/sales/buat-pdf")) return "Buat PDF - Sales";
    if (path.includes("/sales/target")) return "Target Penjualan";
    if (path.includes("/kontraktor/buat-pdf")) return "Buat PDF - Kontraktor";
    if (path.includes("/it")) return "Divisi IT";
    if (path.includes("service")) return "Divisi Service";
    if (path.includes("sales")) return "Divisi Sales";
    if (path.includes("kontraktor")) return "Divisi Kontraktor";
    if (path.includes("profile")) return "Profile";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("karyawan")) return "Profil Karyawan";

    return "Super Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

      <Sidebar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
        isExpanded={sidebarExpanded}
        setIsExpanded={setSidebarExpanded}
        navigate={navigate}
        role={user?.role}
      />

      <main
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarExpanded ? "lg:ml-72" : "lg:ml-20"
        }`}
      >

        <Header
          user={user}
          showBell={false}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 p-8 overflow-y-auto">

          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} />} />
            <Route path="karyawan" element={<KaryawanPage />} />

            <Route path="it">
              <Route index element={<ITPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="service">
              <Route index element={<ServicePage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="sales">
              <Route index element={<SalesPage user={user} />} />
              <Route path="target" element={<TargetPage />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="kontraktor">
              <Route index element={<KontraktorPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="projek-kerja" element={<ProjekKerjaPage />} />
            <Route path="projek-kerja/foto/:id" element={<FotoProjekPage />} />

            <Route
              path="profile"
              element={<Profile user={user} logout={logout} />}
            />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>

        </div>
      </main>
    </div>
  );
}

/* ================= DASHBOARD ================= */

const Dashboard = ({ user }) => {

  const [projek, setProjek] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDesc, setShowDesc] = useState(false);
  const [descText, setDescText] = useState("");
  const [editDesc, setEditDesc] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  const basePath =
    user?.role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const loadData = async () => {
    try {

      const res = await axios.get(
        "http://127.0.0.1:8000/api/projek-kerja"
      );

      let data = res.data?.data || res.data || [];

      if (user?.role !== "super_admin") {
        data = data.filter(p => p.divisi === user?.divisi);
      }

      setProjek(data);

    } catch {

      setProjek([]);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {

    if (!window.confirm("Yakin ingin menghapus projek ini?")) return;

    try {

      await axios.delete(
        `http://127.0.0.1:8000/api/projek-kerja/${id}`
      );

      setProjek(prev => prev.filter(p => p.id !== id));

    } catch {

      alert("Gagal menghapus data");

    }
  };

  /* ================= UPDATE DESKRIPSI ================= */

  const handleUpdateDesc = async () => {

  try {

    await axios.patch(
      `http://127.0.0.1:8000/api/projek-kerja/${selectedId}/deskripsi`,
      {
        problem_description: descText
      }
    );

    setProjek(prev =>
      prev.map(p =>
        p.id === selectedId
          ? { ...p, problem_description: descText }
          : p
      )
    );

    setEditDesc(false);
    setShowDesc(false);

  } catch (err) {

    console.log(err.response);
    alert("Gagal update deskripsi");

  }

};

  const filteredProjek = projek.filter(item => {

    const text =
      (item.jenis_pekerjaan || "") +
      (item.karyawan || "") +
      (item.alamat || "");

    const matchSearch =
      text.toLowerCase().includes(search.toLowerCase());

    const matchDivisi =
      filterDivisi ? item.divisi === filterDivisi : true;

    const matchStatus =
      filterStatus ? item.status === filterStatus : true;

    return matchSearch && matchDivisi && matchStatus;

  });

  const startIndex = page * itemsPerPage;

  const paginatedProjek = filteredProjek.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const total = projek.length;
  const selesai = projek.filter(p => p.status === "Selesai").length;
  const proses = projek.filter(p => p.status === "Proses").length;
  const terlambat = projek.filter(p => p.status === "Terlambat").length;

  if (loading) {
    return (
      <div className="bg-white p-10 rounded-xl shadow text-center">
        Loading data...
      </div>
    );
  }

  return (
    <>
      {/* DIVISI CARD */}
      <div className="bg-white rounded-3xl shadow-md p-8 mb-12">
        <h3 className="text-xl font-semibold mb-6">Divisi</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <DivisiCard
            title="Divisi IT"
            image="/images/IT meet.jpg"
            count={projek.filter(p => p.divisi === "IT").length}
            onClick={() => navigate(`${basePath}/it`)}
          />

          <DivisiCard
            title="Divisi Service"
            image="/images/Service Card.jpg"
            count={projek.filter(p => p.divisi === "Service").length}
            onClick={() => navigate(`${basePath}/service`)}
          />

          <DivisiCard
            title="Divisi Sales"
            image="/images/Sales Card.jpg"
            count={projek.filter(p => p.divisi === "Sales").length}
            onClick={() => navigate(`${basePath}/sales`)}
          />

          <DivisiCard
            title="Divisi Kontraktor"
            image="/images/Kontraktor Card.jpg"
            count={projek.filter(p => p.divisi === "Kontraktor").length}
            onClick={() => navigate(`${basePath}/kontraktor`)}
          />

        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-white rounded-3xl shadow-md p-8 mb-12">

        <h3 className="text-xl font-semibold mb-6">Summary</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

          <SummaryCard title="Total Tugas" value={total} icon={<ListTodo />} color="blue" />
          <SummaryCard title="Tugas Selesai" value={selesai} icon={<CheckCircle />} color="green" />
          <SummaryCard title="Sedang Dikerjakan" value={proses} icon={<Clock />} color="yellow" />
          <SummaryCard title="Tugas Terlambat" value={terlambat} icon={<AlertTriangle />} color="red" />

        </div>

      </div>

      {/* TABLE */}
      
        <div className="bg-white rounded-3xl shadow-md p-8">

          <h3 className="text-xl font-semibold mb-6">
            Aktivitas Pekerjaan
          </h3>

      {/* SEARCH + FILTER */}
        <div className="flex gap-4 mb-6 flex-wrap">

          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-64"
          />

          <select
            value={filterDivisi}
            onChange={(e) => setFilterDivisi(e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-xl"
          >
            <option value="">Semua Divisi</option>
            <option value="IT">IT</option>
            <option value="Service">Service</option>
            <option value="Sales">Sales</option>
            <option value="Kontraktor">Kontraktor</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 px-4 py-2 rounded-xl"
          >
            <option value="">Semua Status</option>
            <option value="Proses">Proses</option>
            <option value="Selesai">Selesai</option>
            <option value="Terlambat">Terlambat</option>
          </select>

        </div>

{/* TABLE */}
      <div className="overflow-x-auto">

        <table className="w-full text-sm border-separate border-spacing-y-2">
        <thead className="text-gray-500 text-xs uppercase bg-gray-50">

      <tr className="text-left">
      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
        <Building size={15} className="text-gray-400"/>
          Divisi
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <Briefcase size={15} className="text-gray-400"/>
      Tugas
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <User size={15} className="text-gray-400"/>
      Karyawan
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <MapPin size={15} className="text-gray-400"/>
      Lokasi
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <Calendar size={15} className="text-gray-400"/>
      Tanggal
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <FileText size={15} className="text-gray-400"/>
      Deskripsi
      </div>
      </th>

      <th className="p-4">
      <div className="flex items-center gap-2 opacity-80">
      <Activity size={15} className="text-gray-400"/>
      Status
      </div>
      </th>

      <th className="p-4 text-center">
      <div className="flex items-center justify-center gap-2 opacity-80">
      <Settings size={15} className="text-gray-400"/>
      Aksi
      </div>
      </th>

      </tr>

      </thead>

      <tbody>
      {paginatedProjek.map(item => (
      <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition">

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

{/* DESKRIPSI */}
        <td className="p-4 text-left">

        <button onClick={() => {

        setSelectedId(item.id);
        setDescText(item.problem_description || "");
        setEditDesc(false);
        setShowDesc(true);

        }}
        className="px-3 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100 transition"
        >

        <Eye size={14}/>
        <span>Lihat</span>

        </button>

        </td>

        {/* STATUS */}
        <td className="p-4 text-left">

            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            item.status === "Selesai" ? "bg-green-100 text-green-600": item.status === "Proses" ? "bg-yellow-100 text-yellow-600" : "bg-red-100 text-red-600"
            }`}
            >
            {item.status}

            </span>

        </td>

{/* AKSI */}
    <td className="p-4">

    <div className="flex items-center justify-center gap-2">

{/* DOWNLOAD */}
    {item.file_url && (

    <a
    href={item.file_url} 
    target="_blank"
    rel="noreferrer"
    className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-sm transition"
    >

    <Download size={16}/>

    </a>

    )}

{/* FOTO PROJEK */}
    <button
    onClick={() => navigate(`${basePath}/projek-kerja/foto/${item.id}`)
    }
    className="bg-green-600 hover:bg-green-700 text-white p-2.5 rounded-xl shadow-sm transition"
    >

    <FileText size={16}/>

    </button>

{/* DELETE */}
    <button
    onClick={() => handleDelete(item.id)} className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-xl shadow-sm transition"
    >

    <Trash2 size={16}/>

    </button>

    </div>

        </td>
        </tr>
          ))}
        </tbody>
      </table>

    </div>

               {/* SLIDE */}
        <div className="flex justify-between mt-6">

          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 0))}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            ← Previous
          </button>

          <button
            onClick={() =>
              setPage(prev =>
                startIndex + itemsPerPage < filteredProjek.length
                  ? prev + 1
                  : prev
              )
            }
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Next →
          </button>

        </div>

      </div>

      {/* ================= MODAL DESKRIPSI ================= */}
      <DeskripsiModal
        showDesc={showDesc}
        setShowDesc={setShowDesc}
        descText={descText}
        setDescText={setDescText}
        editDesc={editDesc}
        setEditDesc={setEditDesc}
        handleUpdateDesc={handleUpdateDesc}
      />

    </>
  );
};

/* CARD */
const DivisiCard = ({ title, count, image, onClick }) => {

  const defaultImage =
    image || "https://via.placeholder.com/400x300?text=Divisi";

  return (

    <div
      onClick={onClick}
      className="relative rounded-3xl overflow-hidden shadow-lg cursor-pointer group transition hover:-translate-y-2 hover:shadow-2xl"
    >

      <img
        src={defaultImage}
        alt={title}
        className="h-56 w-full object-cover group-hover:scale-110 transition duration-500"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      <div className="absolute bottom-0 p-6 text-white">

        <h3 className="text-2xl font-bold">{title}</h3>

        <p className="text-sm mb-2">
          Total {count} Pekerjaan
        </p>

        <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-4 py-2 rounded-xl text-sm">
          Masuk →
        </button>

      </div>

    </div>

  );
};

/* SUMMARY CARD */

const SummaryCard = ({ title, value, icon, color }) => {

  const map = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (

    <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition flex justify-between items-center">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold">{value}</h2>
      </div>

      <div
        className={`w-14 h-14 flex items-center justify-center rounded-xl ${map[color]}`}
      >
        {icon}
      </div>

    </div>

  );

};


/* ================= MODAL DESKRIPSI ================= */

const DeskripsiModal = ({
  showDesc,
  setShowDesc,
  descText,
  setDescText,
  editDesc,
  setEditDesc,
  handleUpdateDesc
}) => {

  if (!showDesc) return null;

  return (

    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999]">

      <div className="bg-white rounded-3xl shadow-xl w-full max-w-xl p-8">

        <h2 className="text-2xl font-bold mb-6">
          Deskripsi Pekerjaan
        </h2>

        {!editDesc ? (

          <>
            <p className="text-gray-700 whitespace-pre-line text-lg">
              {descText || "-"}
            </p>

            <div className="flex justify-end gap-4 mt-8">

              <button
                onClick={() => setEditDesc(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-medium transition"
              >
                Edit
              </button>

              <button
                onClick={() => setShowDesc(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-xl transition"
              >
                Tutup
              </button>

            </div>
          </>

        ) : (

          <>
            <textarea
              value={descText}
              onChange={(e) => setDescText(e.target.value)}
              className="w-full border border-gray-300 rounded-2xl p-4 h-40 focus:ring-2 focus:ring-blue-400 outline-none"
            />

            <div className="flex justify-end gap-4 mt-8">

              <button
                onClick={handleUpdateDesc}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-xl transition"
              >
                Simpan
              </button>

              <button
                onClick={() => setEditDesc(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded-xl transition"
              >
                Batal
              </button>

            </div>
          </>

        )}

      </div>

    </div>

  );

};                                                                                                                                                                                                                                                                                                                                                                                                                            
