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
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import FormBarangPage from "./FormBarangPage";
import EditBarangPage from "./EditBarangPage";
import GeneratePDFPage from "./GeneratePDFPage";
import KaryawanPage from "./KaryawanPage";
import TargetPage from "./TargetPage";

/* PEMBELIAN PURCHASING */
import PembelianPage from "./PembelianPage";

/* LOGISTIK INVENTORY */
import LogistikInventoryPage from "./LogistikInventoryPage";
import LogistikFormBarangPage from "./LogistikFormBarangPage";
import LogistikEditBarangPage from "./LogistikEditBarangPage";

/* ================= MAIN ================= */

export default function SuperAdminDashboard({ user, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();
  const location = useLocation();

  // Effect untuk mendeteksi resize window
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    
    // Panggil sekali untuk set initial width
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
    if (path.includes("logistik")) return "Divisi Logistik";
    if (path.includes("purchasing")) return "Divisi Purchasing";
    if (path.includes("profile")) return "Profile";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("karyawan")) return "Profil Karyawan";

    return "Super Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] w-full overflow-x-hidden">
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
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${
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

        <div className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 overflow-y-auto w-full max-w-full">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard user={user} windowWidth={windowWidth} />} />
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

            <Route path="logistik">
              <Route index element={<LogistikPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
              <Route path="inventory" element={<LogistikInventoryPage />} />
              <Route path="inventory/tambah" element={<LogistikFormBarangPage />} />
              <Route path="inventory/edit/:id" element={<LogistikEditBarangPage />} />
            </Route>

            <Route path="purchasing">
              <Route index element={<PurchasingPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
              <Route path="pembelian" element={<PembelianPage />} />
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

const Dashboard = ({ user, windowWidth }) => {
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
        "https://mansys.hsrsystem.com/api/projek-kerja"
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
        `https://mansys.hsrsystem.com/api/projek-kerja/${id}`
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
        `https://mansys.hsrsystem.com/api/projek-kerja/${selectedId}/deskripsi`,
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

  // Tentukan ukuran berdasarkan windowWidth
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  if (loading) {
    return (
      <div className="bg-white p-6 sm:p-8 md:p-10 rounded-xl shadow text-center">
        Loading data...
      </div>
    );
  }

  return (
    <>
      {/* DIVISI CARD */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8 mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-12">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-5 lg:mb-6">Divisi</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <DivisiCard
            title="Divisi IT"
            image="/images/IT meet.jpg"
            count={projek.filter(p => p.divisi === "IT").length}
            onClick={() => navigate(`${basePath}/it`)}
            isMobile={isMobile}
          />

          <DivisiCard
            title="Divisi Service"
            image="/images/Service Card.jpg"
            count={projek.filter(p => p.divisi === "Service").length}
            onClick={() => navigate(`${basePath}/service`)}
            isMobile={isMobile}
          />

          <DivisiCard
            title="Divisi Sales"
            image="/images/Sales Card.jpg"
            count={projek.filter(p => p.divisi === "Sales").length}
            onClick={() => navigate(`${basePath}/sales`)}
            isMobile={isMobile}
          />

          <DivisiCard
            title="Divisi Kontraktor"
            image="/images/Kontraktor Card.jpg"
            count={projek.filter(p => p.divisi === "Kontraktor").length}
            onClick={() => navigate(`${basePath}/kontraktor`)}
            isMobile={isMobile}
          />

          <DivisiCard
            title="Divisi Logistik"
            image="/images/IT meet.jpg"
            count={projek.filter(p => p.divisi === "Logistik").length}
            onClick={() => navigate(`${basePath}/logistik`)}
            isMobile={isMobile}
          />

          <DivisiCard
            title="Divisi Purchasing"
            image="/images/IT meet.jpg"
            count={projek.filter(p => p.divisi === "Purchasing").length}
            onClick={() => navigate(`${basePath}/purchasing`)}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* SUMMARY */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8 mb-4 sm:mb-5 md:mb-6 lg:mb-8 xl:mb-12">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-5 lg:mb-6">Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6">
          <SummaryCard title="Total Tugas" value={total} icon={<ListTodo size={isMobile ? 16 : 20} />} color="blue" isMobile={isMobile} />
          <SummaryCard title="Tugas Selesai" value={selesai} icon={<CheckCircle size={isMobile ? 16 : 20} />} color="green" isMobile={isMobile} />
          <SummaryCard title="Sedang Dikerjakan" value={proses} icon={<Clock size={isMobile ? 16 : 20} />} color="yellow" isMobile={isMobile} />
          <SummaryCard title="Tugas Terlambat" value={terlambat} icon={<AlertTriangle size={isMobile ? 16 : 20} />} color="red" isMobile={isMobile} />
        </div>
      </div>

      {/* AKTIVITAS PEKERJAAN */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8">
        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 md:mb-5 lg:mb-6">
          Aktivitas Pekerjaan
        </h3>

        {/* SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-56 md:w-64 text-sm"
          />

          <div className="flex flex-col xs:flex-row sm:flex-row gap-2 w-full sm:w-auto">
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl w-full sm:w-36 md:w-40 text-sm"
            >
              <option value="">Semua Divisi</option>
              <option value="IT">IT</option>
              <option value="Service">Service</option>
              <option value="Sales">Sales</option>
              <option value="Kontraktor">Kontraktor</option>
              <option value="Logistik">Logistik</option>
              <option value="Purchasing">Purchasing</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl w-full sm:w-36 md:w-40 text-sm"
            >
              <option value="">Semua Status</option>
              <option value="Proses">Proses</option>
              <option value="Selesai">Selesai</option>
              <option value="Terlambat">Terlambat</option>
            </select>
          </div>
        </div>

        {/* TABLE - Tampilan Desktop (≥ 1024px) - TANPA UBAH APAPUN */}
        {isDesktop && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-separate border-spacing-y-2">
              <thead className="text-gray-500 text-xs uppercase bg-gray-50">
                <tr className="text-left">
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Building size={15} className="text-gray-400"/>
                      Divisi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Briefcase size={15} className="text-gray-400"/>
                      Tugas
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <User size={15} className="text-gray-400"/>
                      Karyawan
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <MapPin size={15} className="text-gray-400"/>
                      Lokasi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Calendar size={15} className="text-gray-400"/>
                      Tanggal
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <FileText size={15} className="text-gray-400"/>
                      Deskripsi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Activity size={15} className="text-gray-400"/>
                      Status
                    </div>
                  </th>
                  <th className="p-3 lg:p-4 text-center">
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
                    <td className="p-3 lg:p-4 text-left">{item.divisi}</td>
                    <td className="p-3 lg:p-4 font-medium text-left">{item.jenis_pekerjaan}</td>
                    <td className="p-3 lg:p-4 text-left">{item.karyawan}</td>
                    <td className="p-3 lg:p-4 text-left">{item.alamat}</td>
                    <td className="p-3 lg:p-4 text-left">
                      {new Date(item.start_date).toLocaleDateString("id-ID")}
                    </td>
                    <td className="p-3 lg:p-4 text-left">
                      <button 
                        onClick={() => {
                          setSelectedId(item.id);
                          setDescText(item.problem_description || "");
                          setEditDesc(false);
                          setShowDesc(true);
                        }}
                        className="px-2 lg:px-3 py-1 rounded-lg text-xs border flex items-center gap-1 hover:bg-gray-100 transition"
                      >
                        <Eye size={14}/>
                        <span>Lihat</span>
                      </button>
                    </td>
                    <td className="p-3 lg:p-4 text-left">
                      <span className={`px-2 lg:px-3 py-1 rounded-full text-xs font-semibold ${
                        item.status === "Selesai" 
                          ? "bg-green-100 text-green-600" 
                          : item.status === "Proses" 
                            ? "bg-yellow-100 text-yellow-600" 
                            : "bg-red-100 text-red-600"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 lg:p-4">
                      <div className="flex items-center justify-center gap-1 lg:gap-2">
                        {/* DOWNLOAD - HANYA TAMPIL DI DESKTOP JIKA ADA FILE_URL */}
                        {item.file_url && (
                          <a
                            href={item.file_url} 
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-sm transition"
                            title="Download"
                          >
                            <Download size={16}/>
                          </a>
                        )}
                        {/* FOTO PROJEK - HANYA ICON, TANPA TEKS */}
                        <button
                          onClick={() => navigate(`${basePath}/projek-kerja/foto/${item.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-sm transition"
                          title="Foto Projek"
                        >
                          <FileText size={16}/>
                        </button>
                        {/* DELETE - HANYA ICON, TANPA TEKS */}
                        <button
                          onClick={() => handleDelete(item.id)} 
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-sm transition"
                          title="Hapus"
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
        )}

        {/* TABLE - Tampilan Mobile/Tablet (< 1024px) - HANYA ICON, TANPA TEKS */}
        {!isDesktop && (
          <div className="space-y-3 sm:space-y-4">
            {paginatedProjek.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase">{item.divisi}</span>
                    <h4 className="font-medium text-sm sm:text-base mt-1">{item.jenis_pekerjaan}</h4>
                  </div>
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                    item.status === "Selesai" 
                      ? "bg-green-100 text-green-600" 
                      : item.status === "Proses" 
                        ? "bg-yellow-100 text-yellow-600" 
                        : "bg-red-100 text-red-600"
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={12} />
                    <span>{item.karyawan}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={12} />
                    <span className="truncate">{item.alamat}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={12} />
                    <span>{new Date(item.start_date).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>

                {/* ACTION BUTTONS - HANYA ICON, TANPA TEKS, SESUAI KETERSEDIAAN FILE */}
                <div className="flex gap-2 pt-2 sm:pt-3 border-t border-gray-100">
                  {/* LIHAT DESKRIPSI - SELALU ADA */}
                  <button
                    onClick={() => {
                      setSelectedId(item.id);
                      setDescText(item.problem_description || "");
                      setEditDesc(false);
                      setShowDesc(true);
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg transition flex items-center justify-center"
                    title="Lihat Deskripsi"
                  >
                    <Eye size={18} />
                  </button>

                  {/* DOWNLOAD - HANYA TAMPIL JIKA ADA FILE_URL */}
                  {item.file_url && (
                    <a
                      href={item.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition flex items-center justify-center"
                      title="Download"
                    >
                      <Download size={18} />
                    </a>
                  )}

                  {/* FOTO PROJEK - SELALU ADA */}
                  <button
                    onClick={() => navigate(`${basePath}/projek-kerja/foto/${item.id}`)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition flex items-center justify-center"
                    title="Foto Projek"
                  >
                    <FileText size={18} />
                  </button>

                  {/* HAPUS - SELALU ADA */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition flex items-center justify-center"
                    title="Hapus"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* INFO TAMBAHAN - TAMPILKAN JIKA TIDAK ADA FILE */}
                {!item.file_url && (
                  <div className="text-xs text-gray-400 mt-2 text-center">
                    *Tidak ada file download
                  </div>
                )}
              </div>
            ))}

            {paginatedProjek.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-gray-500 text-sm">
                Tidak ada data yang ditemukan
              </div>
            )}
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
          <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
            {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredProjek.length)} dari {filteredProjek.length}
          </div>

          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            <button
              onClick={() => setPage(prev => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${
                page === 0 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              ← Prev
            </button>

            <button
              onClick={() => setPage(prev =>
                startIndex + itemsPerPage < filteredProjek.length ? prev + 1 : prev
              )}
              disabled={startIndex + itemsPerPage >= filteredProjek.length}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${
                startIndex + itemsPerPage >= filteredProjek.length 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Next →
            </button>
          </div>
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
        isMobile={isMobile}
      />
    </>
  );
};

/* ================= DIVISI CARD ================= */
const DivisiCard = ({ title, count, image, onClick, isMobile }) => {
  const defaultImage = image || "https://via.placeholder.com/400x300?text=Divisi";

  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-lg cursor-pointer group transition hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl"
    >
      <img
        src={defaultImage}
        alt={title}
        className="h-36 sm:h-40 md:h-44 lg:h-48 xl:h-56 w-full object-cover group-hover:scale-110 transition duration-500"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>

      <div className="absolute bottom-0 p-3 sm:p-4 md:p-5 lg:p-6 text-white">
        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold">{title}</h3>
        <p className="text-xs sm:text-xs md:text-sm mb-1 sm:mb-2">
          Total {count} Pekerjaan
        </p>
        <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl text-xs">
          Masuk →
        </button>
      </div>
    </div>
  );
};

/* ================= SUMMARY CARD ================= */
const SummaryCard = ({ title, value, icon, color, isMobile }) => {
  const map = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm hover:shadow-lg transition flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-xs sm:text-xs md:text-sm">{title}</p>
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">{value}</h2>
      </div>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 flex items-center justify-center rounded-lg md:rounded-xl ${map[color]}`}>
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
  handleUpdateDesc,
  isMobile
}) => {
  if (!showDesc) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-3 sm:p-4">
      <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-5 md:p-6 lg:p-8">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6">
            Deskripsi Pekerjaan
          </h2>

          {!editDesc ? (
            <>
              <div className="text-gray-700 whitespace-pre-line text-sm sm:text-base md:text-lg max-h-60 overflow-y-auto">
                {descText || "-"}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-5 md:mt-8">
                <button
                  onClick={() => setEditDesc(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium transition order-2 sm:order-1 text-sm sm:text-base"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDesc(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition order-1 sm:order-2 text-sm sm:text-base"
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
                className="w-full border border-gray-300 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 h-32 sm:h-36 md:h-40 focus:ring-2 focus:ring-blue-400 outline-none text-sm sm:text-base"
              />

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-5 md:mt-6">
                <button
                  onClick={handleUpdateDesc}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition order-2 sm:order-1 text-sm sm:text-base"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditDesc(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition order-1 sm:order-2 text-sm sm:text-base"
                >
                  Batal
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};