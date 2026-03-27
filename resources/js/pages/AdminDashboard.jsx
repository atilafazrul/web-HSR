import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import axios from "axios";

import {
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Search,
  Building,
  Briefcase,
  User,
  Calendar,
  Activity
} from "lucide-react";

/* ================= IMPORT PAGE ================= */

import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import Profile from "./Profile";
import FormPekerjaanPage from "./FormPekerjaanPage";
import GeneratePDFPage from "./GeneratePDFPage";
import TargetPage from "./TargetPage";

/* INVENTORY */
import InventoryPage from "./InventoryPage";
import FormBarangPage from "./FormBarangPage";
import EditBarangPage from "./EditBarangPage";

/* PEMBELIAN PURCHASING */
import PembelianPage from "./PembelianPage";

/* LOGISTIK INVENTORY */
import LogistikInventoryPage from "./LogistikInventoryPage";
import LogistikFormBarangPage from "./LogistikFormBarangPage";
import LogistikEditBarangPage from "./LogistikEditBarangPage";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function AdminDashboard({ user, logout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [currentUser] = useState(user);
  const [dashboardData, setDashboardData] = useState([]);
  const [allProjekData, setAllProjekData] = useState([]);

  // State untuk search, filter, dan pagination
  const [search, setSearch] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const currentDivisi = user?.divisi || "Service";

  const navigate = useNavigate();
  const location = useLocation();

  const api = axios.create({
    baseURL: "https://mansys.hsrsystem.com/api",
  });

  // Effect untuk mendeteksi resize window
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchAllProjekData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get("/projek-kerja");

      let data = res.data;
      if (data?.data) data = data.data;

      setDashboardData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal load dashboard data", err);
    }
  };

  const fetchAllProjekData = async () => {
    try {
      const res = await api.get("/projek-kerja");

      let data = res.data;
      if (data?.data) data = data.data;

      setAllProjekData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Gagal load semua data projek", err);
    }
  };

  /* ================= TITLE ================= */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("inventory")) return "Inventory";
    if (path.includes("target")) return "Target Penjualan";
    if (path.includes("projek-kerja/foto")) return "Foto Projek";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("it")) return "Divisi IT";
    if (path.includes("service")) return "Divisi Service";
    if (path.includes("sales")) return "Divisi Sales";
    if (path.includes("kontraktor")) return "Divisi Kontraktor";
    if (path.includes("logistik")) return "Divisi Logistik";
    if (path.includes("purchasing")) return "Divisi Purchasing";
    if (path.includes("profile")) return "Profile";

    return "Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [location.pathname]);

  // Data untuk card divisi (tetap filter berdasarkan divisi user)
  const filteredDashboardData = dashboardData.filter(
    item => item.divisi === currentDivisi
  );

  // Filter untuk tabel aktivitas semua divisi
  const filteredAllProjek = allProjekData.filter(item => {
    const text = (item.jenis_pekerjaan || "") + (item.karyawan || "") + (item.alamat || "");
    const matchSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchDivisi = filterDivisi ? item.divisi === filterDivisi : true;
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return matchSearch && matchDivisi && matchStatus;
  });

  // Pagination
  const startIndex = page * itemsPerPage;
  const paginatedProjek = filteredAllProjek.slice(startIndex, startIndex + itemsPerPage);

  // Tentukan ukuran berdasarkan windowWidth
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  // Fungsi untuk mendapatkan gambar berdasarkan divisi
  const getDivisiImage = (divisi) => {
    const imageMap = {
      "IT": "/images/IT meet.jpg",
      "Service": "/images/Service Card.jpg",
      "Sales": "/images/Sales Card.jpg",
      "Kontraktor": "/images/Kontraktor Card.jpg",
      "Logistik": "/images/IT meet.jpg", // default image
      "Purchasing": "/images/IT meet.jpg", // default image
    };
    return imageMap[divisi] || "/images/IT meet.jpg";
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] w-full overflow-x-hidden">
      <Sidebar
        user={currentUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
        isExpanded={sidebarExpanded}
        setIsExpanded={setSidebarExpanded}
        navigate={navigate}
        role="admin"
      />

      <main
        className={`flex-1 flex flex-col transition-all duration-300 w-full
        ${sidebarExpanded ? "lg:ml-72" : "lg:ml-20"}`}
      >
        <Header
          user={currentUser}
          showBell={false}
          sidebarExpanded={sidebarExpanded}
          setSidebarExpanded={setSidebarExpanded}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex-1 p-4 sm:p-5 md:p-6 lg:p-8 overflow-y-auto w-full max-w-full">
          <Routes>
            <Route path="/" element={<Navigate to="dashboard" replace />} />

            {/* ================= DASHBOARD ================= */}
            <Route
              path="dashboard"
              element={
                <>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-10">
                    Selamat Datang, {currentUser?.name}
                  </h2>

                  {/* ================= CARD DIVISI ================= */}
                  <div className="w-full mb-6 sm:mb-8 md:mb-10">
                    <DivisiCard
                      title={`Divisi ${currentDivisi}`}
                      count={filteredDashboardData.length}
                      onClick={() =>
                        navigate(`/admin/${currentDivisi.toLowerCase()}`)
                      }
                      image={getDivisiImage(currentDivisi)}
                      isMobile={isMobile}
                    />
                  </div>

                  {/* ================= SUMMARY ================= */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 sm:mb-8 md:mb-10">
                    <SummaryCard
                      title="Total Tugas"
                      value={filteredDashboardData.length}
                      icon={<ListTodo size={isMobile ? 16 : 20} />}
                      color="blue"
                      isMobile={isMobile}
                    />

                    <SummaryCard
                      title="Selesai"
                      value={filteredDashboardData.filter(d => d.status === "Selesai").length}
                      icon={<CheckCircle size={isMobile ? 16 : 20} />}
                      color="green"
                      isMobile={isMobile}
                    />

                    <SummaryCard
                      title="Proses"
                      value={filteredDashboardData.filter(d => d.status === "Proses").length}
                      icon={<Clock size={isMobile ? 16 : 20} />}
                      color="yellow"
                      isMobile={isMobile}
                    />

                    <SummaryCard
                      title="Terlambat"
                      value={filteredDashboardData.filter(d => d.status === "Terlambat").length}
                      icon={<AlertTriangle size={isMobile ? 16 : 20} />}
                      color="red"
                      isMobile={isMobile}
                    />
                  </div>

                  {/* ================= TABLE AKTIVITAS PEKERJAAN ================= */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8 mb-6 sm:mb-8 md:mb-10">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-5 md:mb-6">
                      Aktivitas Pekerjaan Semua Divisi
                    </h3>

                    {/* SEARCH + FILTER */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Cari..."
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                          }}
                          className="border border-gray-200 pl-9 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full text-sm"
                        />
                      </div>

                      <div className="flex flex-col xs:flex-row sm:flex-row gap-3">
                        <select
                          value={filterDivisi}
                          onChange={(e) => {
                            setFilterDivisi(e.target.value);
                            setPage(0);
                          }}
                          className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-36 text-sm"
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
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(0);
                          }}
                          className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-36 text-sm"
                        >
                          <option value="">Semua Status</option>
                          <option value="Proses">Proses</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Terlambat">Terlambat</option>
                        </select>
                      </div>
                    </div>

                    {/* TABLE - TAMPILAN DESKTOP (≥ 1024px) - MIRIP SUPERADMIN */}
                    {isDesktop && (
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
                                  <Activity size={15} className="text-gray-400"/>
                                  Status
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProjek.map((item) => (
                              <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition">
                                <td className="p-4 text-left">{item.divisi}</td>
                                <td className="p-4 font-medium text-left">{item.jenis_pekerjaan}</td>
                                <td className="p-4 text-left">{item.karyawan}</td>
                                <td className="p-4 text-left">{item.alamat}</td>
                                <td className="p-4 text-left">
                                  {new Date(item.start_date).toLocaleDateString("id-ID")}
                                </td>
                                <td className="p-4 text-left">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    item.status === "Selesai" 
                                      ? "bg-green-100 text-green-600" 
                                      : item.status === "Proses" 
                                        ? "bg-yellow-100 text-yellow-600" 
                                        : "bg-red-100 text-red-600"
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TABLE - TAMPILAN TABLET (640px - 1023px) */}
                    {isTablet && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-separate border-spacing-y-2">
                          <thead className="text-gray-500 text-xs uppercase bg-gray-50">
                            <tr className="text-left">
                              <th className="p-4">Divisi</th>
                              <th className="p-4">Tugas</th>
                              <th className="p-4">Karyawan</th>
                              <th className="p-4">Status</th>
                              <th className="p-4">Tanggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProjek.map((item) => (
                              <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition">
                                <td className="p-4 text-left">{item.divisi}</td>
                                <td className="p-4 font-medium text-left">{item.jenis_pekerjaan}</td>
                                <td className="p-4 text-left">{item.karyawan}</td>
                                <td className="p-4 text-left">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    item.status === "Selesai" 
                                      ? "bg-green-100 text-green-600" 
                                      : item.status === "Proses" 
                                        ? "bg-yellow-100 text-yellow-600" 
                                        : "bg-red-100 text-red-600"
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-4 text-left text-gray-500">
                                  {new Date(item.start_date).toLocaleDateString("id-ID")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* TABLE - TAMPILAN MOBILE (< 640px) */}
                    {isMobile && (
                      <div className="space-y-3">
                        {paginatedProjek.map((item) => (
                          <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xs font-semibold text-gray-500 uppercase">{item.divisi}</span>
                                <h4 className="font-medium text-base mt-1">{item.jenis_pekerjaan}</h4>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                                item.status === "Selesai" 
                                  ? "bg-green-100 text-green-600" 
                                  : item.status === "Proses" 
                                    ? "bg-yellow-100 text-yellow-600" 
                                    : "bg-red-100 text-red-600"
                              }`}>
                                {item.status}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium min-w-[70px]">Karyawan:</span>
                                <span>{item.karyawan}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="min-w-[70px]" />
                                <span className="truncate">{item.alamat}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium min-w-[70px]">Tanggal:</span>
                                <span>{new Date(item.start_date).toLocaleDateString("id-ID")}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* PAGINATION */}
                    {filteredAllProjek.length > 0 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-5 md:mt-6">
                        <div className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
                          Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAllProjek.length)} dari {filteredAllProjek.length} data
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
                              startIndex + itemsPerPage < filteredAllProjek.length ? prev + 1 : prev
                            )}
                            disabled={startIndex + itemsPerPage >= filteredAllProjek.length}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${
                              startIndex + itemsPerPage >= filteredAllProjek.length 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-200 hover:bg-gray-300'
                            }`}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Pesan jika tidak ada data */}
                    {filteredAllProjek.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        Tidak ada data yang ditemukan
                      </div>
                    )}
                  </div>
                </>
              }
            />

            {/* ================= FOTO PROJEK ================= */}
            <Route
              path="projek-kerja/foto/:id"
              element={<FotoProjekPage />}
            />

            {/* ================= INVENTORY ================= */}
            <Route path="it/inventory" element={<InventoryPage />} />
            <Route path="it/inventory/tambah" element={<FormBarangPage />} />
            <Route path="it/inventory/edit/:id" element={<EditBarangPage />} />
            <Route path="service/inventory" element={<InventoryPage />} />
            <Route path="service/inventory/tambah" element={<FormBarangPage />} />
            <Route path="service/inventory/edit/:id" element={<EditBarangPage />} />

            {/* ================= DIVISI ================= */}
            <Route path="it" element={<ITPage user={user} />} />
            <Route path="service" element={<ServicePage user={user} />} />
            <Route path="service/form-pekerjaan" element={<FormPekerjaanPage />} />
            <Route path="sales" element={<SalesPage user={user} />} />
            <Route path="kontraktor" element={<KontraktorPage user={user} />} />

            {/* ================= PROJEK ================= */}
            <Route path="it/projek" element={<ProjekKerjaPage />} />
            <Route path="sales/target" element={<TargetPage />} />
            <Route path="it/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="service/projek" element={<ProjekKerjaPage />} />
            <Route path="service/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="sales/projek" element={<ProjekKerjaPage />} />
            <Route path="sales/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="kontraktor/projek" element={<ProjekKerjaPage />} />
            <Route path="kontraktor/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="logistik" element={<LogistikPage user={user} />} />
            <Route path="purchasing" element={<PurchasingPage user={user} />} />
            <Route path="logistik/projek" element={<ProjekKerjaPage />} />
            <Route path="purchasing/projek" element={<ProjekKerjaPage />} />
            <Route path="logistik/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="purchasing/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="purchasing/pembelian" element={<PembelianPage />} />
            
            <Route path="logistik/inventory" element={<LogistikInventoryPage />} />
            <Route path="logistik/inventory/tambah" element={<LogistikFormBarangPage />} />
            <Route path="logistik/inventory/edit/:id" element={<LogistikEditBarangPage />} />

            {/* ================= PROFILE ================= */}
            <Route
              path="profile"
              element={<Profile user={currentUser} logout={logout} />}
            />

            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ================= CARD DIVISI ================= */
const DivisiCard = ({ title, count, onClick, image, isMobile }) => {
  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl cursor-pointer group transition duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl"
    >
      <img
        src={image}
        alt={title}
        className="h-40 sm:h-44 md:h-48 lg:h-56 w-full object-cover group-hover:scale-110 transition duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
      <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-white/20 backdrop-blur-md px-2 sm:px-3 py-1 rounded-full text-xs text-white font-medium">
        Dashboard
      </div>
      <div className="absolute bottom-0 p-4 sm:p-5 md:p-6 text-white w-full">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide mb-1">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">
          Total <span className="font-semibold">{count}</span> Pekerjaan
        </p>
        <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
          Masuk
          <span className="group-hover:translate-x-1 transition">→</span>
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
    <div className="bg-white p-3 sm:p-4 md:p-5 lg:p-6 rounded-lg sm:rounded-xl md:rounded-2xl shadow hover:shadow-lg transition flex justify-between items-center">
      <div>
        <p className="text-gray-500 text-xs sm:text-sm">{title}</p>
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">{value}</h2>
      </div>
      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl flex items-center justify-center ${map[color]}`}>
        {icon}
      </div>
    </div>
  );
};