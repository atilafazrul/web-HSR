import React, { useState, useEffect, useMemo } from "react";
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
  Settings,
  Package,
} from "lucide-react";

import axios from "../api/axiosConfig";

/* REKAP PER AKUN */
import RekapPerAkun from "../components/RekapPerAkun";

/* PAGES */
import Profile from "./Profile.jsx";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import BiayaDashboardPanel from "../components/BiayaDashboardPanel";
import {
  dashboardShellBgClass,
  DashboardWelcome,
  DashboardSurface,
  DashboardSectionHeading,
  DashboardSummaryCard,
  projekActivityStatusPillClass,
} from "../components/dashboard/DashboardPrimitives.jsx";
import { useI18n } from "../i18n/index.jsx";

import ITPage from "./ITPage";
import InventoryPage from "./InventoryPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import EditProjekKerjaPage from "./EditProjekKerjaPage";
import FormBarangPage from "./FormBarangPage";
import EditBarangPage from "./EditBarangPage";
import GeneratePDFPage from "./GeneratePDFPage";
import KaryawanPage from "./KaryawanPage";
import TargetPage from "./TargetPage";

/* BERITA ACARA */
import BeritaAcaraPage from "./BeritaAcaraPage";
import BAUFPage from "./berita-acara/BAUFPage";
import BASTPage from "./berita-acara/BASTPage";
import BAMPage from "./berita-acara/BAMPage";
import SPPDPage from "./berita-acara/SPPDPage";

/* PEMBELIAN PURCHASING */
import PembelianPage from "./PembelianPage";

/* LOGISTIK INVENTORY */
import LogistikInventoryPage from "./LogistikInventoryPage";
import LogistikFormBarangPage from "./LogistikFormBarangPage";
import LogistikEditBarangPage from "./LogistikEditBarangPage";

/* ================= MAIN ================= */

export default function SuperAdminDashboard({ user, logout }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
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

    if (path.includes("projek-kerja/foto")) return language === "en" ? "Manage Photos & Documents" : "Kelola Foto & dokumen";
    if (path.includes("projek-kerja")) return language === "en" ? "Project Work" : "Projek Kerja";
    if (path.includes("/it/buat-pdf")) return language === "en" ? "Create PDF - IT" : "Buat PDF - IT";
    if (path.includes("/service/buat-pdf")) return language === "en" ? "Create PDF - Service" : "Buat PDF - Service";
    if (path.includes("/sales/buat-pdf")) return language === "en" ? "Create PDF - Sales" : "Buat PDF - Sales";
    if (path.includes("/sales/target")) return language === "en" ? "Sales Target" : "Target Penjualan";
    if (path.includes("/kontraktor/buat-pdf")) return language === "en" ? "Create PDF - Kontraktor" : "Buat PDF - Kontraktor";
    if (path.includes("/it")) return "Divisi IT";
    if (path.includes("service")) return "Divisi Service";
    if (path.includes("sales")) return "Divisi Sales";
    if (path.includes("kontraktor")) return "Divisi Kontraktor";
    if (path.includes("logistik")) return "Divisi Logistik";
    if (path.includes("purchasing")) return "Divisi Purchasing";
    if (path.includes("profile")) return language === "en" ? "Profile" : "Profil";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("karyawan")) return "Profil Karyawan";

    return language === "en" ? "Super Admin" : "Super Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [language, location.pathname]);

  return (
    <div className={dashboardShellBgClass}>
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
        className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${sidebarExpanded ? "lg:pl-72" : "lg:pl-20"
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
            <Route path="rekap-akun" element={<RekapPerAkun user={user} />} />

            {/* BERITA ACARA */}
            <Route path="berita-acara" element={<BeritaAcaraPage />} />
            <Route path="berita-acara/bam" element={<BAMPage />} />
            <Route path="berita-acara/bauf" element={<BAUFPage />} />
            <Route path="berita-acara/bast" element={<BASTPage />} />
            <Route path="berita-acara/sppd" element={<SPPDPage />} />

            <Route path="it">
              <Route index element={<ITPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="service">
              <Route index element={<ServicePage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="sales">
              <Route index element={<SalesPage user={user} />} />
              <Route path="target" element={<TargetPage />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="kontraktor">
              <Route index element={<KontraktorPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/tambah" element={<FormBarangPage />} />
              <Route path="inventory/edit/:id" element={<EditBarangPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
            </Route>

            <Route path="logistik">
              <Route index element={<LogistikPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
              <Route path="inventory" element={<LogistikInventoryPage />} />
              <Route path="inventory/tambah" element={<LogistikFormBarangPage />} />
              <Route path="inventory/edit/:id" element={<LogistikEditBarangPage />} />
            </Route>

            <Route path="purchasing">
              <Route index element={<PurchasingPage user={user} />} />
              <Route path="projek" element={<ProjekKerjaPage />} />
              <Route path="projek/archive" element={<ProjekKerjaPage />} />
              <Route path="buat-pdf" element={<GeneratePDFPage user={user} />} />
              <Route path="pembelian" element={<PembelianPage />} />
            </Route>

            <Route path="projek-kerja" element={<ProjekKerjaPage />} />
            <Route path="projek-kerja/foto/:id/*" element={<FotoProjekPage />} />
            <Route path="projek-kerja/edit/:id" element={<EditProjekKerjaPage />} />

            <Route
              path="profile"
              element={<Profile user={user} logout={logout} />}
            />

            {/* Fallback harus absolute biar tidak jadi /.../dashboard/dashboard */}
            <Route path="*" element={<Navigate to="/super_admin/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

/* ================= DASHBOARD ================= */

const Dashboard = ({ user, windowWidth }) => {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
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
      // Super Admin melihat semua data, Admin hanya melihat data divisi sendiri
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/projek-kerja`
      );

      let data = res.data?.data || res.data || [];

      // Admin hanya melihat data divisi sendiri
      if (user?.role !== "super_admin") {
        data = data.filter(p => p.divisi === user?.divisi);
      }

      console.log("Dashboard loaded:", data.length, "projects");
      setProjek(data);
    } catch (err) {
      console.error("Dashboard load error:", err);
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
    if (!window.confirm(language === "en" ? "Are you sure you want to delete this project?" : "Yakin ingin menghapus projek ini?")) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/projek-kerja/${id}`
      );
      setProjek(prev => prev.filter(p => p.id !== id));
    } catch {
      alert(language === "en" ? "Failed to delete data" : "Gagal menghapus data");
    }
  };

  /* ================= UPDATE DESKRIPSI ================= */
  const handleUpdateDesc = async () => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/projek-kerja/${selectedId}/deskripsi`,
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
      alert(language === "en" ? "Failed to update description" : "Gagal update deskripsi");
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
  const statusSummary = useMemo(() => {
    const counter = new Map();
    projek.forEach((item) => {
      const label = String(item?.status || "Tanpa Status").trim() || "Tanpa Status";
      counter.set(label, (counter.get(label) || 0) + 1);
    });
    const preferredOrder = ["Dibuat", "Persiapan", "Proses Pekerjaan", "Editing", "Invoicing", "Barang sudah siap", "Selesai", "Terlambat"];
    return Array.from(counter.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => {
        const ai = preferredOrder.indexOf(a.label);
        const bi = preferredOrder.indexOf(b.label);
        if (ai === -1 && bi === -1) return a.label.localeCompare(b.label);
        if (ai === -1) return 1;
        if (bi === -1) return -1;
        return ai - bi;
      });
  }, [projek]);

  const displayStatus = (status) => {
    const map = {
      Dibuat: "Created",
      Persiapan: "Preparation",
      "Proses Pekerjaan": "Work In Progress",
      Proses: "In Progress",
      Editing: "Editing",
      Invoicing: "Invoicing",
      Selesai: "Completed",
      Terlambat: "Delayed",
      "Barang sudah siap": "Items Ready",
      "Tanpa Status": "No Status",
    };
    return language === "en" ? (map[status] || status) : status;
  };

  // Tentukan ukuran berdasarkan windowWidth
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktop = windowWidth >= 1024;

  if (loading) {
    return (
      <div className="space-y-4 p-4 sm:p-6">
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200/80" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-40 animate-pulse rounded-2xl bg-slate-200/60" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <DashboardWelcome
        greeting={language === "en" ? "Welcome" : "Selamat Datang"}
        name={user?.name}
      />

      <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
        <DashboardSectionHeading title={language === "en" ? "Divisions" : "Divisi"} />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          <DivisiCard
            title={language === "en" ? "IT Division" : "Divisi IT"}
            image="/images/IT Card.png"
            count={projek.filter(p => p.divisi === "IT").length}
            onClick={() => navigate(`${basePath}/it`)}
            isMobile={isMobile}
            language={language}
          />

          <DivisiCard
            title={language === "en" ? "Service Division" : "Divisi Service"}
            image="/images/Card Service.png"
            count={projek.filter(p => p.divisi === "Service").length}
            onClick={() => navigate(`${basePath}/service`)}
            isMobile={isMobile}
            language={language}
          />

          <DivisiCard
            title={language === "en" ? "Sales Division" : "Divisi Sales"}
            image="/images/Card Sales.png"
            count={projek.filter(p => p.divisi === "Sales").length}
            onClick={() => navigate(`${basePath}/sales`)}
            isMobile={isMobile}
            language={language}
          />

          <DivisiCard
            title={language === "en" ? "Contractor Division" : "Divisi Kontraktor"}
            image="/images/Kontraktor Card.png"
            count={projek.filter(p => p.divisi === "Kontraktor").length}
            onClick={() => navigate(`${basePath}/kontraktor`)}
            isMobile={isMobile}
            language={language}
          />

          <DivisiCard
            title={language === "en" ? "Logistics Division" : "Divisi Logistik"}
            image="/images/logistik card.png"
            count={projek.filter(p => p.divisi === "Logistik").length}
            onClick={() => navigate(`${basePath}/logistik`)}
            isMobile={isMobile}
            language={language}
          />

          <DivisiCard
            title={language === "en" ? "Purchasing Division" : "Divisi Purchasing"}
            image="/images/Purchasing Card.png"
            count={projek.filter(p => p.divisi === "Purchasing").length}
            onClick={() => navigate(`${basePath}/purchasing`)}
            isMobile={isMobile}
            language={language}
          />
        </div>
      </DashboardSurface>

      <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
        <DashboardSectionHeading
          title={language === "en" ? "Status summary" : "Ringkasan status"}
          subtitle={tr("Ringkasan pekerjaan berdasarkan semua status yang aktif.", "Work summary based on all active statuses.")}
        />

        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3 sm:gap-4 md:gap-5">
          <DashboardSummaryCard title={tr("Total Tugas", "Total Tasks")} value={total} icon={<ListTodo size={isMobile ? 16 : 20} />} color="blue" isMobile={isMobile} />
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

      <BiayaDashboardPanel user={user} showInput={true} />

      <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
        <DashboardSectionHeading title={language === "en" ? "Work activity" : "Aktivitas pekerjaan"} />

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-5 lg:mb-6">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 sm:w-56 md:w-64 sm:px-4"
          />

          <div className="flex w-full flex-col gap-2 xs:flex-row sm:w-auto sm:flex-row">
            <select
              value={filterDivisi}
              onChange={(e) => setFilterDivisi(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 sm:w-36 md:w-40 sm:px-4"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 sm:w-36 md:w-40 sm:px-4"
            >
              <option value="">Semua Status</option>
              <option value="Proses">Proses</option>
              <option value="Barang sudah siap">{tr("Barang sudah siap", "Items Ready")}</option>
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
                      <Building size={15} className="text-gray-400" />
                      Divisi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Briefcase size={15} className="text-gray-400" />
                      Tugas
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <User size={15} className="text-gray-400" />
                      Karyawan
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <MapPin size={15} className="text-gray-400" />
                      Lokasi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Calendar size={15} className="text-gray-400" />
                      Tanggal
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <FileText size={15} className="text-gray-400" />
                      Deskripsi
                    </div>
                  </th>
                  <th className="p-3 lg:p-4">
                    <div className="flex items-center gap-2 opacity-80">
                      <Activity size={15} className="text-gray-400" />
                      Status
                    </div>
                  </th>
                  <th className="p-3 lg:p-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-80">
                      <Settings size={15} className="text-gray-400" />
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
                        type="button"
                        onClick={() => {
                          setSelectedId(item.id);
                          setDescText(item.problem_description || "");
                          setEditDesc(false);
                          setShowDesc(true);
                        }}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                        title={language === "en" ? "View description" : "Lihat deskripsi"}
                      >
                        <Eye size={14} aria-hidden />
                      </button>
                    </td>
                    <td className="p-3 lg:p-4 text-left whitespace-nowrap">
                      <span className={projekActivityStatusPillClass(item.status)}>
                        {displayStatus(item.status)}
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
                            <Download size={16} />
                          </a>
                        )}
                        {/* FOTO PROJEK - HANYA ICON, TANPA TEKS */}
                        <button
                          onClick={() => navigate(`${basePath}/projek-kerja/foto/${item.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-sm transition"
                          title="Foto Projek"
                        >
                          <FileText size={16} />
                        </button>
                        {/* DELETE - HANYA ICON, TANPA TEKS */}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white p-1.5 lg:p-2 rounded-lg lg:rounded-xl shadow-sm transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
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
                <div className="flex justify-between items-start gap-2 mb-2 sm:mb-3">
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">{item.divisi}</span>
                    <h4 className="font-medium text-sm sm:text-base mt-1">{item.jenis_pekerjaan}</h4>
                  </div>
                  <span className={projekActivityStatusPillClass(item.status)}>
                    {displayStatus(item.status)}
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${page === 0
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
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition ${startIndex + itemsPerPage >= filteredProjek.length
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 hover:bg-gray-300'
                }`}
            >
              Next →
            </button>
          </div>
        </div>
      </DashboardSurface>

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
    </div>
  );
};

/* ================= DIVISI CARD ================= */
const DivisiCard = ({ title, count, image, onClick, isMobile, language = "id" }) => {
  const defaultImage = image || "https://via.placeholder.com/400x300?text=Divisi";

  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-900/10 transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-3xl sm:hover:-translate-y-2"
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
          {language === "en" ? "Total" : "Total"} {count} {language === "en" ? "Tasks" : "Pekerjaan"}
        </p>
        <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg sm:rounded-xl text-xs">
          {language === "en" ? "Open" : "Masuk"} →
        </button>
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