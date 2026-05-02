import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
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
import api from "../api/axiosConfig";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import {
  dashboardShellBgClass,
  DashboardWelcome,
  DashboardSurface,
  DashboardSectionHeading,
  DashboardSummaryCard,
  projekActivityStatusPillClass,
} from "../components/dashboard/DashboardPrimitives.jsx";
import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import Profile from "./Profile";
import { useI18n } from "../i18n/index.jsx";

const DIVISI_TO_PATH = {
  IT: "it",
  Service: "service",
  Sales: "sales",
  Kontraktor: "kontraktor",
  Logistik: "logistik",
  Purchasing: "purchasing",
};

const DIVISI_PAGE = {
  it: ITPage,
  service: ServicePage,
  sales: SalesPage,
  kontraktor: KontraktorPage,
  logistik: LogistikPage,
  purchasing: PurchasingPage,
};

export default function UserDashboard({ user, logout }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [data, setData] = useState([]);
  const [divisiData, setDivisiData] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const itemsPerPage = 5;

  const currentDivisi = user?.divisi || "Service";
  const divisiPath = DIVISI_TO_PATH[currentDivisi] || "service";
  const CurrentDivisiPage = DIVISI_PAGE[divisiPath] || ServicePage;

  const pageTitle = useMemo(() => {
    if (location.pathname.includes("/profile")) return language === "en" ? "Profile" : "Profil";
    if (location.pathname.includes("/projek-kerja/foto/")) return language === "en" ? "Project Photos" : "Foto Projek";
    if (location.pathname.includes("/dashboard")) return language === "en" ? "User Dashboard" : "Dashboard User";
    return "User";
  }, [language, location.pathname]);

  useEffect(() => {
    document.title = `WEB HSR - ${pageTitle}`;
  }, [pageTitle]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await api.get("/projek-kerja");
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        setDivisiData(rows);
        setData(rows);
      } catch (err) {
        console.error("Gagal load data user dashboard", err);
        setDivisiData([]);
        setData([]);
      }
    };
    loadData();
  }, [currentDivisi]);

  const filteredData = data.filter((item) => {
    const text = `${item.jenis_pekerjaan || ""} ${item.karyawan || ""} ${item.alamat || ""}`.toLowerCase();
    const bySearch = text.includes(search.toLowerCase());
    const byStatus = statusFilter ? item.status === statusFilter : true;
    return bySearch && byStatus;
  });

  const startIndex = page * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const summaryData = divisiData;
  const total = summaryData.length;
  const statusSummary = useMemo(() => {
    const counter = new Map();
    summaryData.forEach((item) => {
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
  }, [summaryData]);

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
        role="user"
      />

      <main className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${sidebarExpanded ? "lg:pl-72" : "lg:pl-20"}`}>
        <Header
          user={user}
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
              path="dashboard"
              element={
                <div className="space-y-6 sm:space-y-8">
                  <DashboardWelcome
                    greeting={language === "en" ? "Welcome" : "Selamat Datang"}
                    name={user?.name}
                  />

                  <div
                    onClick={() => navigate(`/user/${divisiPath}`)}
                    className="relative cursor-pointer overflow-hidden rounded-2xl shadow-lg ring-1 ring-slate-900/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:rounded-3xl sm:hover:-translate-y-1"
                  >
                    <img
                      src="/images/IT meet.jpg"
                      alt={`Divisi ${currentDivisi}`}
                      className="h-40 sm:h-44 md:h-48 lg:h-56 w-full object-cover group-hover:scale-110 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-white/20 backdrop-blur-md px-2 sm:px-3 py-1 rounded-full text-xs text-white font-medium">
                      Dashboard
                    </div>
                    <div className="absolute bottom-0 p-4 sm:p-5 md:p-6 text-white w-full">
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold tracking-wide mb-1">
                        Divisi {currentDivisi}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-200 mb-3 sm:mb-4">
                        Total <span className="font-semibold">{total}</span> Pekerjaan
                      </p>
                      <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium">
                        {language === "en" ? "Open" : "Masuk"}
                        <span className="group-hover:translate-x-1 transition">→</span>
                      </button>
                    </div>
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
                    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-3 sm:gap-4">
                    <DashboardSummaryCard title={tr("Total Tugas", "Total Tasks")} value={total} icon={<ListTodo size={18} />} color="blue" />
                    {statusSummary.map((status) => (
                      <DashboardSummaryCard
                        key={status.label}
                        title={displayStatus(status.label)}
                        value={status.count}
                        icon={
                          status.label === "Selesai" ? <CheckCircle size={18} />
                            : status.label === "Barang sudah siap" ? <Package size={18} />
                              : status.label.includes("Proses") ? <Clock size={18} />
                                : status.label === "Terlambat" ? <AlertTriangle size={18} />
                                  : <Activity size={18} />
                        }
                        color={
                          status.label === "Selesai" ? "green"
                            : status.label === "Barang sudah siap" ? "blue"
                              : status.label.includes("Proses") ? "yellow"
                                : status.label === "Terlambat" ? "red"
                                  : "blue"
                        }
                      />
                    ))}
                    </div>
                  </DashboardSurface>

                  <DashboardSurface className="p-4 sm:p-5 md:p-6 lg:p-8">
                    <DashboardSectionHeading
                      title={language === "en" ? "Your division activity" : "Aktivitas pekerjaan divisi Anda"}
                    />

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
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0);
                        }}
                        className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-40 text-sm"
                      >
                        <option value="">{language === "en" ? "All Statuses" : "Semua Status"}</option>
                        <option value="Proses">{tr("Proses", "In Progress")}</option>
                        <option value="Barang sudah siap">{tr("Barang sudah siap", "Items Ready")}</option>
                        <option value="Selesai">{tr("Selesai", "Completed")}</option>
                        <option value="Terlambat">{tr("Terlambat", "Delayed")}</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-separate border-spacing-y-2">
                        <thead className="text-gray-500 text-xs uppercase bg-gray-50">
                          <tr className="text-left">
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Building size={15} className="text-gray-400" />{tr("Divisi", "Division")}</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Briefcase size={15} className="text-gray-400" />{language === "en" ? "Task" : "Tugas"}</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><User size={15} className="text-gray-400" />{language === "en" ? "Employee" : "Karyawan"}</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><MapPin size={15} className="text-gray-400" />{language === "en" ? "Location" : "Lokasi"}</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Calendar size={15} className="text-gray-400" />{language === "en" ? "Date" : "Tanggal"}</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Activity size={15} className="text-gray-400" />{tr("Status", "Status")}</span></th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedData.map((item) => (
                            <tr key={item.id} className="bg-white shadow-sm hover:shadow-md transition">
                              <td className="p-4 text-left">{item.divisi}</td>
                              <td className="p-4 font-medium text-left">{item.jenis_pekerjaan}</td>
                              <td className="p-4 text-left">{item.karyawan}</td>
                              <td className="p-4 text-left">{item.alamat}</td>
                              <td className="p-4 text-left">{new Date(item.start_date).toLocaleDateString("id-ID")}</td>
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

                    {filteredData.length > 0 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-5">
                        <div className="text-xs sm:text-sm text-gray-600">
                          {language === "en" ? "Showing" : "Menampilkan"} {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} {language === "en" ? "of" : "dari"} {filteredData.length} {language === "en" ? "records" : "data"}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                            disabled={page === 0}
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition ${
                              page === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            ← Prev
                          </button>
                          <button
                            onClick={() => setPage((prev) => (startIndex + itemsPerPage < filteredData.length ? prev + 1 : prev))}
                            disabled={startIndex + itemsPerPage >= filteredData.length}
                            className={`px-3 py-2 rounded-lg text-xs sm:text-sm transition ${
                              startIndex + itemsPerPage >= filteredData.length
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-200 hover:bg-gray-300"
                            }`}
                          >
                            Next →
                          </button>
                        </div>
                      </div>
                    )}

                    {filteredData.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 py-10 text-center text-sm text-slate-500">
                        {language === "en" ? "No data found" : "Tidak ada data yang ditemukan"}
                      </div>
                    )}
                  </DashboardSurface>

                </div>
              }
            />

            <Route path={divisiPath} element={<CurrentDivisiPage user={user} />} />
            <Route path={`${divisiPath}/projek`} element={<ProjekKerjaPage />} />
            <Route path={`${divisiPath}/projek/archive`} element={<ProjekKerjaPage />} />
            <Route path="projek-kerja/foto/:id/*" element={<FotoProjekPage />} />
            <Route path="profile" element={<Profile user={user} logout={logout} />} />
            <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

