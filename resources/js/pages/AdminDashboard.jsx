import React, { useState, useEffect, useMemo } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation
} from "react-router-dom";
import api from "../api/axiosConfig";

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
  Activity,
  Package,
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
import EditProjekKerjaPage from "./EditProjekKerjaPage";
import KaryawanPage from "./KaryawanPage";
import Profile from "./Profile";
import FormPekerjaanPage from "./FormPekerjaanPage";
import GeneratePDFPage from "./GeneratePDFPage";
import TargetPage from "./TargetPage";
import CutiPage from "./CutiPage";

/* BERITA ACARA */
import BeritaAcaraPage from "./BeritaAcaraPage";
import BAUFPage from "./berita-acara/BAUFPage";
import BASTPage from "./berita-acara/BASTPage";
import BAMPage from "./berita-acara/BAMPage";
import SPPDPage from "./berita-acara/SPPDPage";

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
import BiayaDashboardPanel from "../components/BiayaDashboardPanel";
import RekapPerAkun from "../components/RekapPerAkun";
import {
  dashboardShellBgClass,
  DashboardWelcome,
  DashboardSurface,
  DashboardSectionHeading,
  DashboardSummaryCard,
  projekActivityStatusPillClass,
} from "../components/dashboard/DashboardPrimitives.jsx";
import { useI18n } from "../i18n/index.jsx";

export default function AdminDashboard({ user, logout }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
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
  const currentRole = user?.role || "admin";
  const basePath = currentRole === "super_admin" ? "/super_admin" : currentRole === "user" ? "/user" : "/admin";
  const isUserRole = currentRole === "user";

  const navigate = useNavigate();
  const location = useLocation();

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
    if (path.includes("cuti")) return language === "en" ? "Leave Request" : "Pengajuan Cuti";
    if (path.includes("rekap-akun")) return language === "en" ? "Account Cost Recap" : "Rekap Biaya Akun";
    if (path.includes("target")) return language === "en" ? "Sales Target" : "Target Penjualan";
    if (path.includes("projek-kerja/foto")) return language === "en" ? "Project Photos" : "Foto Projek";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("it")) return language === "en" ? "IT Division" : "Divisi IT";
    if (path.includes("service")) return language === "en" ? "Service Division" : "Divisi Service";
    if (path.includes("sales")) return language === "en" ? "Sales Division" : "Divisi Sales";
    if (path.includes("kontraktor")) return language === "en" ? "Contractor Division" : "Divisi Kontraktor";
    if (path.includes("logistik")) return language === "en" ? "Logistics Division" : "Divisi Logistik";
    if (path.includes("purchasing")) return language === "en" ? "Purchasing Division" : "Divisi Purchasing";
    if (path.includes("profile")) return language === "en" ? "Profile" : "Profil";

    return "Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [language, location.pathname]);

  const displayStatus = (status) => {
    const map = {
      Dibuat: "Created",
      Persiapan: "Preparation",
      "Proses Pekerjaan": "Work In Progress",
      Editing: "Editing",
      Invoicing: "Invoicing",
      Selesai: "Completed",
      Terlambat: "Delayed",
      Proses: "In Progress",
      "Tanpa Status": "No Status",
      "Barang sudah siap": "Items Ready",
    };
    return language === "en" ? (map[status] || status) : status;
  };

  // Data untuk card divisi (tetap filter berdasarkan divisi user)
  const filteredDashboardData = dashboardData.filter(
    item => item.divisi === currentDivisi
  );
  const statusSummary = useMemo(() => {
    const counter = new Map();
    filteredDashboardData.forEach((item) => {
      const label = String(item?.status || "Tanpa Status").trim() || "Tanpa Status";
      counter.set(label, (counter.get(label) || 0) + 1);
    });

    // Status yang WAJIB selalu tampil di Ringkasan, meskipun count = 0.
    const alwaysShow = ["Dibuat", "Persiapan", "Proses Pekerjaan", "Editing", "Invoicing", "Selesai"];
    // Status tambahan yang hanya tampil bila ada datanya.
    const extraOnIfExist = ["Barang sudah siap", "Terlambat"];

    const result = alwaysShow.map((label) => ({
      label,
      count: counter.get(label) || 0,
    }));

    extraOnIfExist.forEach((label) => {
      if ((counter.get(label) || 0) > 0) {
        result.push({ label, count: counter.get(label) });
      }
    });

    return result;
  }, [filteredDashboardData]);

  // Filter untuk tabel aktivitas semua divisi
  const filteredAllProjek = allProjekData.filter(item => {
    const sameDivisiForUser = isUserRole ? item.divisi === currentDivisi : true;
    const text = (item.jenis_pekerjaan || "") + (item.karyawan || "") + (item.alamat || "");
    const matchSearch = text.toLowerCase().includes(search.toLowerCase());
    const matchDivisi = isUserRole ? true : (filterDivisi ? item.divisi === filterDivisi : true);
    const matchStatus = filterStatus ? item.status === filterStatus : true;
    return sameDivisiForUser && matchSearch && matchDivisi && matchStatus;
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
      "IT": "/images/IT Card.png",
      "Service": "/images/Card Service.png",
      "Sales": "/images/Card Sales.png",
      "Kontraktor": "/images/Kontraktor Card.png",
      "Logistik": "/images/logistik card.png",
      "Purchasing": "/images/Purchasing Card.png",
    };
    return imageMap[divisi] || "/images/IT Card.png";
  };

  return (
    <div className={dashboardShellBgClass}>
      <Sidebar
        user={currentUser}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        logout={logout}
        isExpanded={sidebarExpanded}
        setIsExpanded={setSidebarExpanded}
        navigate={navigate}
        role={currentRole}
      />

      <main
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300
        ${sidebarExpanded ? "lg:pl-72" : "lg:pl-20"}`}
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

            <Route
              path="rekap-akun"
              element={<RekapPerAkun user={currentUser} onlyCurrentUser={currentRole === "admin"} />}
            />

            {/* ================= DASHBOARD ================= */}
            <Route
              path="dashboard"
              element={
                <div className="space-y-6 sm:space-y-8">
                  <DashboardWelcome
                    greeting={language === "en" ? "Welcome" : "Selamat Datang"}
                    name={currentUser?.name}
                  />

                  {/* ================= CARD DIVISI ================= */}
                  <div className="w-full">
                    <DivisiCard
                      title={language === "en" ? `${currentDivisi} Division` : `Divisi ${currentDivisi}`}
                      count={filteredDashboardData.length}
                      onClick={() =>
                        navigate(`${basePath}/${currentDivisi.toLowerCase()}`)
                      }
                      image={getDivisiImage(currentDivisi)}
                      isMobile={isMobile}
                      countLabel={tr("Pekerjaan", "Tasks")}
                      openLabel={tr("Masuk", "Open")}
                    />
                  </div>

                  <div>
                    <BiayaDashboardPanel user={currentUser} showInput={currentRole === "admin"} />
                  </div>

                  <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
                    <DashboardSectionHeading
                      title={language === "en" ? "Status summary" : "Ringkasan status"}
                      subtitle={
                        language === "en"
                          ? "Work summary based on all active statuses."
                          : "Ringkasan pekerjaan berdasarkan semua status yang aktif."
                      }
                    />
                    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3 sm:gap-4 md:gap-5">
                      <DashboardSummaryCard
                        title={language === "en" ? "Total Tasks" : "Total Tugas"}
                        value={filteredDashboardData.length}
                        icon={<ListTodo size={isMobile ? 16 : 20} />}
                        color="blue"
                        isMobile={isMobile}
                      />
                      {statusSummary.map((status) => (
                        <DashboardSummaryCard
                          key={status.label}
                          title={displayStatus(status.label)}
                          value={status.count}
                          icon={
                            status.label === "Selesai" ? <CheckCircle size={isMobile ? 16 : 20} />
                              : status.label === "Barang sudah siap" ? <Package size={isMobile ? 16 : 20} />
                                : (status.label.includes("Proses") || status.label === "Proses") ? <Clock size={isMobile ? 16 : 20} />
                                  : status.label === "Terlambat" ? <AlertTriangle size={isMobile ? 16 : 20} />
                                    : <Activity size={isMobile ? 16 : 20} />
                          }
                          color={
                            status.label === "Selesai" ? "green"
                              : status.label === "Barang sudah siap" ? "blue"
                                : (status.label.includes("Proses") || status.label === "Proses") ? "yellow"
                                  : status.label === "Terlambat" ? "red"
                                    : "blue"
                          }
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  </DashboardSurface>

                  <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
                    <DashboardSectionHeading
                      title={
                        isUserRole
                          ? (language === "en" ? "Your division activity" : "Aktivitas pekerjaan divisi Anda")
                          : (language === "en" ? "All divisions activity" : "Aktivitas pekerjaan semua divisi")
                      }
                    />

                    {/* SEARCH + FILTER */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="relative flex-1">
                        <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                        <input
                          type="text"
                          placeholder={language === "en" ? "Search..." : "Cari..."}
                          value={search}
                          onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(0);
                          }}
                          className="border border-gray-200 pl-9 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full text-sm"
                        />
                      </div>

                      <div className="flex flex-col xs:flex-row sm:flex-row gap-3">
                        {!isUserRole && (
                          <select
                            value={filterDivisi}
                            onChange={(e) => {
                              setFilterDivisi(e.target.value);
                              setPage(0);
                            }}
                            className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-36 text-sm"
                          >
                            <option value="">{language === "en" ? "All Divisions" : "Semua Divisi"}</option>
                            <option value="IT">IT</option>
                            <option value="Service">Service</option>
                            <option value="Sales">Sales</option>
                            <option value="Kontraktor">Kontraktor</option>
                            <option value="Logistik">Logistik</option>
                            <option value="Purchasing">Purchasing</option>
                          </select>
                        )}

                        <select
                          value={filterStatus}
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setPage(0);
                          }}
                          className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-36 text-sm"
                        >
                          <option value="">{language === "en" ? "All Statuses" : "Semua Status"}</option>
                          <option value="Proses">{tr("Proses", "In Progress")}</option>
                          <option value="Barang sudah siap">{tr("Barang sudah siap", "Items Ready")}</option>
                          <option value="Selesai">{tr("Selesai", "Completed")}</option>
                          <option value="Terlambat">{tr("Terlambat", "Delayed")}</option>
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
                                  <Building size={15} className="text-gray-400" />
                                  {tr("Divisi", "Division")}
                                </div>
                              </th>
                              <th className="p-4">
                                <div className="flex items-center gap-2 opacity-80">
                                  <Briefcase size={15} className="text-gray-400" />
                                  {tr("Tugas", "Task")}
                                </div>
                              </th>
                              <th className="p-4">
                                <div className="flex items-center gap-2 opacity-80">
                                  <User size={15} className="text-gray-400" />
                                  {tr("Karyawan", "Employee")}
                                </div>
                              </th>
                              <th className="p-4">
                                <div className="flex items-center gap-2 opacity-80">
                                  <MapPin size={15} className="text-gray-400" />
                                  {tr("Lokasi", "Location")}
                                </div>
                              </th>
                              <th className="p-4">
                                <div className="flex items-center gap-2 opacity-80">
                                  <Calendar size={15} className="text-gray-400" />
                                  {tr("Tanggal", "Date")}
                                </div>
                              </th>
                              <th className="p-4">
                                <div className="flex items-center gap-2 opacity-80">
                                  <Activity size={15} className="text-gray-400" />
                                  {tr("Status", "Status")}
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
                                <td className="p-4 text-left whitespace-nowrap">
                                  <span className={projekActivityStatusPillClass(item.status)}>
                                    {displayStatus(item.status)}
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
                              <th className="p-4">{tr("Divisi", "Division")}</th>
                              <th className="p-4">{tr("Tugas", "Task")}</th>
                              <th className="p-4">{tr("Karyawan", "Employee")}</th>
                              <th className="p-4">{tr("Status", "Status")}</th>
                              <th className="p-4">{tr("Tanggal", "Date")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedProjek.map((item) => (
                              <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition">
                                <td className="p-4 text-left">{item.divisi}</td>
                                <td className="p-4 font-medium text-left">{item.jenis_pekerjaan}</td>
                                <td className="p-4 text-left">{item.karyawan}</td>
                                <td className="p-4 text-left whitespace-nowrap">
                                  <span className={projekActivityStatusPillClass(item.status)}>
                                    {displayStatus(item.status)}
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
                            <div className="flex justify-between items-start gap-2 mb-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-xs font-semibold text-gray-500 uppercase">{item.divisi}</span>
                                <h4 className="font-medium text-base mt-1">{item.jenis_pekerjaan}</h4>
                              </div>
                              <span className={projekActivityStatusPillClass(item.status)}>
                                {displayStatus(item.status)}
                              </span>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium min-w-[70px]">{tr("Karyawan", "Employee")}:</span>
                                <span>{item.karyawan}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <MapPin size={14} className="min-w-[70px]" />
                                <span className="truncate">{item.alamat}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-medium min-w-[70px]">{tr("Tanggal", "Date")}:</span>
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
                          {language === "en" ? "Showing" : "Menampilkan"} {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredAllProjek.length)} {language === "en" ? "of" : "dari"} {filteredAllProjek.length} {language === "en" ? "records" : "data"}
                        </div>

                        <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
                          <button
                            onClick={() => setPage(prev => Math.max(prev - 1, 0))}
                            disabled={page === 0}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${page === 0
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
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${startIndex + itemsPerPage >= filteredAllProjek.length
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
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-500">
                        {language === "en" ? "No data found" : "Tidak ada data yang ditemukan"}
                      </div>
                    )}
                  </DashboardSurface>
                </div>
              }
            />

            {/* ================= FOTO PROJEK ================= */}
            <Route
              path="projek-kerja/foto/:id/*"
              element={<FotoProjekPage />}
            />
            <Route path="projek-kerja/edit/:id" element={<EditProjekKerjaPage />} />
            <Route path="karyawan" element={<KaryawanPage />} />

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
            <Route path="it/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="sales/target" element={<TargetPage />} />
            <Route path="it/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="service/projek" element={<ProjekKerjaPage />} />
            <Route path="service/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="service/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="sales/projek" element={<ProjekKerjaPage />} />
            <Route path="sales/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="sales/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="kontraktor/projek" element={<ProjekKerjaPage />} />
            <Route path="kontraktor/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="kontraktor/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="logistik" element={<LogistikPage user={user} />} />
            <Route path="purchasing" element={<PurchasingPage user={user} />} />
            <Route path="logistik/projek" element={<ProjekKerjaPage />} />
            <Route path="logistik/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="purchasing/projek" element={<ProjekKerjaPage />} />
            <Route path="purchasing/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="logistik/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="purchasing/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="purchasing/pembelian" element={<PembelianPage />} />

            <Route path="logistik/inventory" element={<LogistikInventoryPage />} />
            <Route path="logistik/inventory/tambah" element={<LogistikFormBarangPage />} />
            <Route path="logistik/inventory/edit/:id" element={<LogistikEditBarangPage />} />

            {/* ================= PENGAJUAN CUTI ================= */}
            <Route path="cuti" element={<CutiPage />} />

            {/* ================= BERITA ACARA ================= */}
            <Route path="berita-acara" element={<BeritaAcaraPage />} />
            <Route path="berita-acara/bam" element={<BAMPage />} />
            <Route path="berita-acara/bauf" element={<BAUFPage />} />
            <Route path="berita-acara/bast" element={<BASTPage />} />
            <Route path="berita-acara/sppd" element={<SPPDPage />} />

            {/* ================= PROFILE ================= */}
            <Route
              path="profile"
              element={<Profile user={currentUser} logout={logout} />}
            />

            {/* Fallback harus absolute biar tidak jadi /.../dashboard/dashboard */}
            <Route path="*" element={<Navigate to={`${basePath}/dashboard`} replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ================= CARD DIVISI ================= */
const DivisiCard = ({ title, count, onClick, image, isMobile, countLabel = "Pekerjaan", openLabel = "Masuk" }) => {
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:hover:-translate-y-2"
    >
      <div className="relative h-72 sm:h-80 md:h-96 w-full">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover object-[center_45%] group-hover:scale-110 transition duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

        <div className="absolute bottom-0 p-6 sm:p-8 text-white w-full">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-wide mb-1">
          {title}
          </h3>
          <p className="text-sm sm:text-base text-gray-200 mb-4">
            Total <span className="font-semibold">{count}</span> {countLabel}
          </p>
          <button className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-6 py-3 text-sm font-medium transition hover:bg-white/30">
            {openLabel}
            <span className="group-hover:translate-x-1 transition">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
