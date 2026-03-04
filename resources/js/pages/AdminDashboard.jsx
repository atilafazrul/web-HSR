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
import FotoProjekPage from "./FotoProjekPage";
import Profile from "./Profile";
import FormPekerjaanPage from "./FormPekerjaanPage";
import GeneratePDFPage from "./GeneratePDFPage";
import TargetPage from "./TargetPage";

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

  const currentDivisi = user?.divisi || "Service";

  const navigate = useNavigate();
  const location = useLocation();

  const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
  });

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
    if (path.includes("target")) return "Target Penjualan";
    if (path.includes("projek-kerja/foto")) return "Foto Projek";
    if (path.includes("dashboard")) return "Dashboard";
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

  const filteredDashboardData = dashboardData.filter(
    item => item.divisi === currentDivisi
  );

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
                  <h2 className="text-3xl font-bold mb-10">
                    Selamat Datang, {currentUser?.name}
                  </h2>

                  {/* ================= CARD DIVISI ================= */}

                  <div className="w-full mb-10">

                    <DivisiCard
                      title={`Divisi ${currentDivisi}`}
                      count={filteredDashboardData.length}
                      onClick={() =>
                        navigate(`/admin/${currentDivisi.toLowerCase()}`)
                      }
                    />

                  </div>

                  {/* ================= SUMMARY ================= */}

                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                    <SummaryCard
                      title="Total Tugas"
                      value={filteredDashboardData.length}
                      icon={<ListTodo />}
                      color="blue"
                    />

                    <SummaryCard
                      title="Selesai"
                      value={filteredDashboardData.filter(d => d.status === "Selesai").length}
                      icon={<CheckCircle />}
                      color="green"
                    />

                    <SummaryCard
                      title="Proses"
                      value={filteredDashboardData.filter(d => d.status === "Proses").length}
                      icon={<Clock />}
                      color="yellow"
                    />

                    <SummaryCard
                      title="Terlambat"
                      value={filteredDashboardData.filter(d => d.status === "Terlambat").length}
                      icon={<AlertTriangle />}
                      color="red"
                    />

                  </div>

                  {/* ================= TABLE ================= */}

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

                        {filteredDashboardData.map((item) => (

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

/* ================= CARD DIVISI (UI UPGRADE) ================= */

const DivisiCard = ({ title, count, onClick }) => {

  const defaultImage =
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1200&auto=format&fit=crop";

  return (

    <div
      onClick={onClick}
      className="relative rounded-3xl overflow-hidden shadow-xl cursor-pointer group transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >

      {/* IMAGE */}
      <img
        src={defaultImage}
        alt={title}
        className="h-56 w-full object-cover group-hover:scale-110 transition duration-500"
      />

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>

      {/* BADGE */}
      <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white font-medium">
        Dashboard
      </div>

      {/* CONTENT */}
      <div className="absolute bottom-0 p-6 text-white w-full">

        <h3 className="text-2xl font-bold tracking-wide mb-1">
          {title}
        </h3>

        <p className="text-sm text-gray-200 mb-4">
          Total <span className="font-semibold">{count}</span> Pekerjaan
        </p>

        {/* BUTTON */}
        <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md hover:bg-white/30 transition px-4 py-2 rounded-xl text-sm font-medium">

          Masuk
          <span className="group-hover:translate-x-1 transition">→</span>

        </button>

      </div>

    </div>

  );

};


/* =====================================================
   TAMBAHKAN COMPONENT INI (JANGAN HAPUS YANG DI ATAS)
   ===================================================== */

const SummaryCard = ({ title, value, icon, color }) => {

  const map = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  return (

    <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold">{value}</h2>
      </div>

      <div
        className={`w-14 h-14 rounded-xl flex items-center justify-center ${map[color]}`}
      >
        {icon}
      </div>

    </div>

  );

};
/* =====================================================
   COMPONENT ROW TABEL AKTIVITAS (WAJIB ADA)
   ===================================================== */

const ActivityRow = ({ divisi, tugas, nama, lokasi, status, tanggal }) => {

  const map = {
    Selesai: "bg-green-100 text-green-600",
    Proses: "bg-yellow-100 text-yellow-600",
    Terlambat: "bg-red-100 text-red-600",
  };

  return (

    <tr className="border-b hover:bg-gray-50">

      <td className="py-4 px-3 font-medium">
        {divisi}
      </td>

      <td className="py-4 px-3">
        {tugas}
      </td>

      <td className="py-4 px-3">
        {nama}
      </td>

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