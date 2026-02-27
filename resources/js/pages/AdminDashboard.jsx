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
} from "lucide-react";

/* ================= IMPORT PAGE ================= */

import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import ProjekKerjaPage from "./ProjekKerjaPage";
import Profile from "./Profile";
import FormPekerjaanPage from "./FormPekerjaanPage";
import GeneratePDFPage from "./GeneratePDFPage";

/* INVENTORY */
import InventoryPage from "./InventoryPage";
import FormBarangPage from "./FormBarangPage";
import EditBarangPage from "./EditBarangPage";

import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";

export default function AdminDashboard({ user, logout }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [currentUser] = useState(user);
  const [dashboardData, setDashboardData] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();

  const currentDivisi = user?.divisi || "Service";

  /* ================= API ================= */

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
  });

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    fetchDashboardData();
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

  /* ================= TITLE ================= */

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes("inventory")) return "Inventory";
    if (path.includes("/it/buat-pdf")) return "Buat PDF - IT";
    if (path.includes("/service/buat-pdf")) return "Buat PDF - Service";
    if (path.includes("/sales/buat-pdf")) return "Buat PDF - Sales";
    if (path.includes("/kontraktor/buat-pdf")) return "Buat PDF - Kontraktor";
    if (path.includes("dashboard")) return "Dashboard";
    if (path.includes("/it/buat-pdf")) return "Buat PDF - IT";
    if (path.includes("/service/buat-pdf")) return "Buat PDF - Service";
    if (path.includes("/sales/buat-pdf")) return "Buat PDF - Sales";
    if (path.includes("/kontraktor/buat-pdf")) return "Buat PDF - Kontraktor";
    if (path.includes("it")) return "Divisi IT";
    if (path.includes("service")) return "Divisi Service";
    if (path.includes("sales")) return "Divisi Sales";
    if (path.includes("kontraktor")) return "Divisi Kontraktor";
    if (path.includes("profile")) return "Profile";

    return "Admin";
  };

  useEffect(() => {
    document.title = `WEB HSR - ${getPageTitle()}`;
  }, [location.pathname]);

  /* ================= HELPER ================= */

  const getDivisiPage = () => {
    if (currentDivisi === "IT") return "/admin/it";
    if (currentDivisi === "Service" || currentDivisi === "SERVICE") return "/admin/service";
    if (currentDivisi === "Kontraktor") return "/admin/kontraktor";
    if (currentDivisi === "Sales") return "/admin/sales";
    return "/admin/service";
  };

  const getDivisiImage = () => {
    if (currentDivisi === "IT") return "/images/it.jpg";
    if (currentDivisi === "Service" || currentDivisi === "SERVICE") return "/images/service.jpg";
    if (currentDivisi === "Kontraktor") return "/images/kontraktor.jpg";
    if (currentDivisi === "Sales") return "/images/sales.jpg";
    return "/images/service.jpg";
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

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
        className={`flex-1 flex flex-col transition-all duration-300
        ${sidebarExpanded ? "lg:ml-72" : "lg:ml-20"}`}
      >

        <Header
          user={currentUser}
          showBell={false}
          title={getPageTitle()}
        />

        <div className="flex-1 p-8 overflow-y-auto">

          <Routes>

            <Route path="/" element={<Navigate to="dashboard" replace />} />

            {/* ================= DASHBOARD ================= */}
            <Route
              path="dashboard"
              element={
                <>
                  <h2 className="text-3xl font-bold mb-2">
                    Selamat Datang, {currentUser?.name}
                  </h2>

                  <p className="text-gray-500 mb-10">
                    Selamat datang di sistem HSR
                  </p>

                  <div className="bg-white rounded-3xl shadow p-8 mb-10">
                    <h3 className="text-xl font-semibold mb-6">
                      Divisi
                    </h3>

                    <DivisiCard
                      title={currentDivisi}
                      image={getDivisiImage()}
                      onClick={() => navigate(getDivisiPage())}
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                    <SummaryCard
                      title="Total Tugas"
                      value={dashboardData.length}
                      icon={<ListTodo />}
                      color="blue"
                    />

                    <SummaryCard
                      title="Selesai"
                      value={dashboardData.filter(d => d.status === "Selesai").length}
                      icon={<CheckCircle />}
                      color="green"
                    />

                    <SummaryCard
                      title="Proses"
                      value={dashboardData.filter(d => d.status === "Proses").length}
                      icon={<Clock />}
                      color="yellow"
                    />

                    <SummaryCard
                      title="Terlambat"
                      value={dashboardData.filter(d => d.status === "Terlambat").length}
                      icon={<AlertTriangle />}
                      color="red"
                    />

                  </div>

                  <div className="bg-white rounded-3xl shadow p-8 mb-10">

                    <h3 className="text-xl font-semibold mb-6">
                      Aktivitas Pekerjaan
                    </h3>

                    <table className="w-full text-sm border-collapse">

                      <thead>
                        <tr className="border-b text-gray-500">
                          <th className="py-3 px-3 text-left">Divisi</th>
                          <th className="py-3 px-3 text-left">Tugas</th>
                          <th className="py-3 px-3 text-left">Karyawan</th>
                          <th className="py-3 px-3 text-left">Lokasi</th>
                          <th className="py-3 px-3 text-center">Status</th>
                          <th className="py-3 px-3 text-center">Tanggal</th>
                        </tr>
                      </thead>

                      <tbody>
                        {dashboardData.map((item) => (
                          <ActivityRow
                            key={item.id}
                            divisi={item.divisi}
                            tugas={item.jenis_pekerjaan}
                            nama={item.karyawan}
                            lokasi={item.alamat}
                            status={item.status}
                            tanggal={item.start_date}
                          />
                        ))}
                      </tbody>

                    </table>
                  </div>
                </>
              }
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
            <Route path="it/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="service/projek" element={<ProjekKerjaPage />} />
            <Route path="service/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="sales/projek" element={<ProjekKerjaPage />} />
            <Route path="sales/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="kontraktor/projek" element={<ProjekKerjaPage />} />
            <Route path="kontraktor/buat-pdf" element={<GeneratePDFPage user={user} />} />

            {/* ================= PDF ================= */}

            <Route path="it/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="service/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="sales/buat-pdf" element={<GeneratePDFPage user={user} />} />
            <Route path="kontraktor/buat-pdf" element={<GeneratePDFPage user={user} />} />

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

/* ================= COMPONENT ================= */

const SummaryCard = ({ title, value, icon, color }) => {
  const map = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow flex justify-between">
      <div>
        <p className="text-gray-500">{title}</p>
        <h2 className="text-3xl font-bold">{value}</h2>
      </div>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${map[color]}`}>
        {icon}
      </div>
    </div>
  );
};

const DivisiCard = ({ title, image, onClick }) => (
  <div
    onClick={onClick}
    className="relative rounded-3xl overflow-hidden shadow cursor-pointer group"
  >
    <img
      src={image}
      className="h-56 w-full object-cover group-hover:scale-110 transition"
      alt={title}
    />
    <div className="absolute inset-0 bg-black/50"></div>
    <div className="absolute bottom-0 p-6 text-white">
      <h3 className="text-2xl font-bold">{title}</h3>
      <button className="bg-white/20 px-4 py-2 rounded-xl mt-2">
        Masuk →
      </button>
    </div>
  </div>
);

const ActivityRow = ({ divisi, tugas, nama, lokasi, status, tanggal }) => {
  const map = {
    Selesai: "bg-green-100 text-green-600",
    Proses: "bg-yellow-100 text-yellow-600",
    Terlambat: "bg-red-100 text-red-600",
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="py-4 px-3 font-medium">{divisi}</td>
      <td className="py-4 px-3">{tugas}</td>
      <td className="py-4 px-3">{nama}</td>
      <td className="py-4 px-3">
        <div className="flex items-center gap-1 text-gray-600">
          <MapPin size={14} />
          <span>{lokasi}</span>
        </div>
      </td>
      <td className="py-4 px-3 text-center">
        <span className={`px-3 py-1 rounded-full text-xs ${map[status]}`}>
          {status}
        </span>
      </td>
      <td className="py-4 px-3 text-center text-gray-500">
        {new Date(tanggal).toLocaleDateString("id-ID")}
      </td>
    </tr>
  );
};