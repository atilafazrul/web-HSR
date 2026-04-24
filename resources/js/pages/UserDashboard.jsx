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
} from "lucide-react";
import api from "../api/axiosConfig";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import LogistikPage from "./LogistikPage";
import PurchasingPage from "./PurchasingPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import FotoProjekPage from "./FotoProjekPage";
import Profile from "./Profile";
import BiayaDashboardPanel from "../components/BiayaDashboardPanel";

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
  const normalizedRole = String(user?.role || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const canInputBiaya = normalizedRole === "admin";

  const pageTitle = useMemo(() => {
    if (location.pathname.includes("/profile")) return "Profile";
    if (location.pathname.includes("/projek-kerja/foto/")) return "Foto Projek";
    if (location.pathname.includes("/dashboard")) return "User Dashboard";
    return "User";
  }, [location.pathname]);

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
    const preferredOrder = ["Dibuat", "Persiapan", "Proses Pekerjaan", "Editing", "Invoicing", "Selesai", "Terlambat"];
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
                <div className="space-y-6">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">Selamat Datang, {user?.name}</h2>

                  <div
                    onClick={() => navigate(`/user/${divisiPath}`)}
                    className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl cursor-pointer group transition duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl"
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
                        Masuk
                        <span className="group-hover:translate-x-1 transition">→</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8">
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800">Summary Status</h3>
                      <p className="text-xs sm:text-sm text-slate-500">Ringkasan pekerjaan berdasarkan semua status yang aktif.</p>
                    </div>
                    <div className="grid [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))] gap-4">
                    <SummaryCard title="Total Tugas" value={total} icon={<ListTodo size={18} />} color="blue" />
                    {statusSummary.map((status) => (
                      <SummaryCard
                        key={status.label}
                        title={status.label}
                        value={status.count}
                        icon={
                          status.label === "Selesai" ? <CheckCircle size={18} />
                            : status.label.includes("Proses") ? <Clock size={18} />
                              : status.label === "Terlambat" ? <AlertTriangle size={18} />
                                : <Activity size={18} />
                        }
                        color={
                          status.label === "Selesai" ? "green"
                            : status.label.includes("Proses") ? "yellow"
                              : status.label === "Terlambat" ? "red"
                                : "blue"
                        }
                      />
                    ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md p-4 sm:p-5 md:p-6 lg:p-8">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-5 md:mb-6">
                      Aktivitas Pekerjaan Divisi Anda
                    </h3>

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
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setPage(0);
                        }}
                        className="border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-40 text-sm"
                      >
                        <option value="">Semua Status</option>
                        <option value="Proses">Proses</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Terlambat">Terlambat</option>
                      </select>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-separate border-spacing-y-2">
                        <thead className="text-gray-500 text-xs uppercase bg-gray-50">
                          <tr className="text-left">
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Building size={15} className="text-gray-400" />Divisi</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Briefcase size={15} className="text-gray-400" />Tugas</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><User size={15} className="text-gray-400" />Karyawan</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><MapPin size={15} className="text-gray-400" />Lokasi</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Calendar size={15} className="text-gray-400" />Tanggal</span></th>
                            <th className="p-4"><span className="flex items-center gap-2 opacity-80"><Activity size={15} className="text-gray-400" />Status</span></th>
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

                    {filteredData.length > 0 && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-5">
                        <div className="text-xs sm:text-sm text-gray-600">
                          Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredData.length)} dari {filteredData.length} data
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
                      <div className="text-center py-8 text-gray-500">Tidak ada data yang ditemukan</div>
                    )}
                  </div>

                  <BiayaDashboardPanel user={user} showInput={canInputBiaya} />
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

const SummaryCard = ({ title, value, icon, color }) => {
  const map = {
    blue: {
      badge: "bg-blue-100 text-blue-700 ring-blue-200",
      dot: "bg-blue-500",
    },
    green: {
      badge: "bg-green-100 text-green-700 ring-green-200",
      dot: "bg-green-500",
    },
    yellow: {
      badge: "bg-yellow-100 text-yellow-700 ring-yellow-200",
      dot: "bg-yellow-500",
    },
    red: {
      badge: "bg-red-100 text-red-700 ring-red-200",
      dot: "bg-red-500",
    },
  };
  const theme = map[color] || map.blue;
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50/80 border border-slate-200/70 p-3 sm:p-4 md:p-5 lg:p-6 rounded-xl md:rounded-2xl shadow-sm hover:shadow-md transition-all flex justify-between items-center">
      <div className="min-w-0">
        <p className="text-slate-500 text-[11px] sm:text-xs tracking-wide">{title}</p>
        <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-slate-900">{value}</h2>
      </div>
      <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 flex items-center justify-center rounded-lg md:rounded-xl ring-1 ring-inset ${theme.badge}`}>
        {icon}
      </div>
      <span className={`absolute top-0 left-0 h-1 w-full ${theme.dot}`} />
    </div>
  );
};
