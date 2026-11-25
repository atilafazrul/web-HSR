import React, { useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
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
  FileText,
  ShoppingCart,
  Eye,
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
  buildDashboardKaryawanRows,
  getDashboardCurrentKaryawan,
} from "../components/dashboard/DashboardPrimitives.jsx";
import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import SIPLAHPage from "./SIPLAHPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import Profile from "./Profile";
import SettingsPage from "./SettingsPage";
import DynamicDivisiPage from "./DynamicDivisiPage.jsx";
import { useDivisis } from "../utils/divisiConfig.jsx";
import { useI18n } from "../i18n/index.jsx";

const DIVISI_TO_PATH = {
  IT: "it",
  Service: "service",
  Sales: "sales",
  Kontraktor: "kontraktor",
  Logistik: "logistik",
  Purchasing: "purchasing",
  SIPLAH: "siplah",
};

const DIVISI_PAGE = {
  it: ITPage,
  service: ServicePage,
  sales: SalesPage,
  kontraktor: KontraktorPage,
  logistik: LogistikPage,
  purchasing: PurchasingPage,
  siplah: SIPLAHPage,
};

export default function UserDashboard({ user, logout }) {
  const { language } = useI18n();
  const tr = (id, en) => (language === "en" ? en : id);
  const { divisis } = useDivisis();
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
  const [modalPopup, setModalPopup] = useState({ open: false, title: "", text: "" });

  const currentDivisi = user?.divisi || "Service";
  const matchedDivisi = divisis.find(
    (d) =>
      String(d.name || "").toLowerCase() === String(currentDivisi).toLowerCase() ||
      String(d.slug || "").toLowerCase() === String(currentDivisi).toLowerCase()
  );
  const divisiPath = matchedDivisi?.slug || DIVISI_TO_PATH[currentDivisi] || String(currentDivisi).toLowerCase() || "service";
  const CurrentDivisiPage = DIVISI_PAGE[divisiPath] || DynamicDivisiPage;

  const getDivisiImage = (divisi) => {
    if (matchedDivisi?.card_image) return matchedDivisi.card_image;
    const imageMap = {
      IT: "/images/IT Card.png",
      Service: "/images/Card Service.png",
      Sales: "/images/Card Sales.png",
      Kontraktor: "/images/Kontraktor Card.png",
      Logistik: "/images/logistik card.png",
      Purchasing: "/images/Purchasing Card.png",
      SIPLAH: "/images/Purchasing Card.png",
    };
    return imageMap[divisi] || "/images/IT Card.png";
  };

  const pageTitle = useMemo(() => {
    if (location.pathname.includes("/profile")) return language === "en" ? "Profile" : "Profil";
    if (location.pathname.includes("/settings")) return language === "en" ? "Settings" : "Pengaturan";
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

                  <Link
                    to={`/user/${divisiPath}`}
                    className="group relative block cursor-pointer overflow-hidden rounded-3xl shadow-xl ring-1 ring-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl sm:hover:-translate-y-2"
                  >
                    <div className="relative h-72 sm:h-80 md:h-96 w-full">
                      <img
                        src={getDivisiImage(currentDivisi)}
                        alt={`Divisi ${currentDivisi}`}
                        className="absolute inset-0 h-full w-full object-cover object-[center_45%] group-hover:scale-110 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />

                      <div className="absolute bottom-0 p-6 sm:p-8 text-white w-full">
                        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-wide mb-1">
                          Divisi {currentDivisi}
                        </h3>
                        <p className="text-sm sm:text-base text-gray-200 mb-4">
                          Total <span className="font-semibold">{total}</span> {tr("Pekerjaan", "Tasks")}
                        </p>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 backdrop-blur-md px-6 py-3 text-sm font-medium transition hover:bg-white/30">
                          {language === "en" ? "Open" : "Masuk"}
                          <span className="group-hover:translate-x-1 transition">→</span>
                        </span>
                      </div>
                    </div>
                  </Link>

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

                    <div className="w-full overflow-x-auto rounded-xl border border-slate-200/80">
                      <div className="inline-block min-w-full align-middle">
                        <table className="min-w-full text-sm" style={{ minWidth: "1020px", tableLayout: "fixed" }}>
                          <thead className="border-b border-slate-200 bg-slate-50/95 text-slate-600">
                            <tr className="text-left bg-slate-50/95">
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "90px" }}>
                                <Building size={16} className="inline mr-1 text-gray-400" /> {tr("Divisi", "Division")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ minWidth: "220px" }}>
                                <Briefcase size={16} className="inline mr-1 text-gray-400" /> {tr("Tugas", "Task")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "150px" }}>
                                <User size={16} className="inline mr-1 text-gray-400" /> {tr("Karyawan", "Employee")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "180px" }}>
                                <MapPin size={16} className="inline mr-1 text-gray-400" /> {tr("Lokasi", "Location")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "110px" }}>
                                <Calendar size={16} className="inline mr-1 text-gray-400" /> {tr("Tanggal", "Date")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "110px" }}>
                                <FileText size={16} className="inline mr-1 text-gray-400" /> {tr("Deskripsi", "Description")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "100px" }}>
                                <ShoppingCart size={16} className="inline mr-1 text-gray-400" /> {tr("Barang", "Items")}
                              </th>
                              <th className="p-2.5 font-semibold whitespace-nowrap" style={{ width: "140px" }}>
                                <Activity size={16} className="inline mr-1 text-gray-400" /> {tr("Status", "Status")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedData.map((item) => {
                              const divisiFlow = Array.isArray(item.divisi_flow) && item.divisi_flow.length > 0
                                ? item.divisi_flow
                                : [item.divisi || "-"];
                              const currentDivVal = String(item.divisi || "").toLowerCase().trim();
                              const karyawanRows = buildDashboardKaryawanRows(item);
                              const currentKaryawan = getDashboardCurrentKaryawan(item);

                              return (
                                <tr key={item.id} className="border-b border-slate-100 bg-white transition hover:bg-slate-50/70">
                                  <td className="p-2.5">
                                    <select
                                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500/20"
                                      value={currentDivVal}
                                      title={tr("Divisi yang pernah terlibat (klik untuk lihat)", "Divisions involved")}
                                      onChange={(e) => {
                                        e.target.value = currentDivVal;
                                      }}
                                    >
                                      {divisiFlow.map((d, idx) => (
                                        <option key={`${d}-${idx}`} value={String(d || "").toLowerCase().trim()}>
                                          {d || "-"}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="p-2.5">
                                    <Link
                                      to={`/user/projek-kerja/foto/${item.id}`}
                                      className="block w-full truncate text-left font-medium text-slate-800 transition hover:text-indigo-600 hover:underline"
                                      title={tr("Buka halaman dokumen projek", "Open project document page")}
                                    >
                                      {item.jenis_pekerjaan}
                                    </Link>
                                  </td>
                                  <td className="p-2.5">
                                    {karyawanRows.length <= 1 ? (
                                      <span className="block truncate">
                                        {karyawanRows[0]
                                          ? karyawanRows[0].isInvite
                                            ? `${karyawanRows[0].display} (Invite)`
                                            : karyawanRows[0].display
                                          : currentKaryawan || "-"}
                                      </span>
                                    ) : (
                                      <select
                                        className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-500/20"
                                        value={currentKaryawan}
                                        onChange={(e) => {
                                          e.target.value = currentKaryawan;
                                        }}
                                        title={tr("Karyawan yang terlibat di project", "Employees involved in project")}
                                      >
                                        {karyawanRows.map((row, idx) => (
                                          <option key={`${row.display}-${idx}`} value={row.display}>
                                            {row.isInvite ? `${row.display} (Invite)` : row.display}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </td>
                                  <td className="p-2.5 truncate">{item.alamat || "-"}</td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    {item.start_date ? new Date(item.start_date).toLocaleDateString("id-ID") : "-"}
                                  </td>
                                  <td className="p-2.5">
                                    {item.problem_description ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setModalPopup({
                                            open: true,
                                            title: tr("Deskripsi Pekerjaan", "Work Description"),
                                            text: item.problem_description,
                                          })
                                        }
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                        title={tr("Lihat deskripsi", "View description")}
                                      >
                                        <Eye size={14} aria-hidden />
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="p-2.5">
                                    {item.barang_dibeli ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setModalPopup({
                                            open: true,
                                            title: tr("Barang yang Dibeli", "Purchased Items"),
                                            text: item.barang_dibeli,
                                          })
                                        }
                                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                                        title={tr("Lihat barang dibeli", "View purchased items")}
                                      >
                                        <Eye size={14} aria-hidden />
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    <span className={projekActivityStatusPillClass(item.status)}>
                                      {displayStatus(item.status)}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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

                    {modalPopup.open && (
                      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-3 sm:p-4 backdrop-blur-sm">
                        <div className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xl">
                          <h3 className="mb-4 text-lg font-bold text-slate-800">{modalPopup.title}</h3>
                          <p className="max-h-60 overflow-y-auto whitespace-pre-line text-sm text-slate-700">
                            {modalPopup.text || "-"}
                          </p>
                          <div className="mt-6 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setModalPopup({ open: false, title: "", text: "" })}
                              className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-300"
                            >
                              {tr("Tutup", "Close")}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </DashboardSurface>

                </div>
              }
            />

            <Route path={divisiPath} element={<CurrentDivisiPage user={user} />} />
            <Route path={`${divisiPath}/projek`} element={<ProjekKerjaPage />} />
            <Route path={`${divisiPath}/projek/archive`} element={<ProjekKerjaPage />} />
            <Route path=":divisiSlug" element={<DynamicDivisiPage />} />
            <Route path=":divisiSlug/projek" element={<ProjekKerjaPage />} />
            <Route path=":divisiSlug/projek/archive" element={<ProjekKerjaPage />} />
            <Route path="projek-kerja/foto/:id/*" element={<FotoProjekPage />} />
            <Route path="profile" element={<Profile user={user} logout={logout} />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

