import React, { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  Wrench,
  User,
  BarChart3,
  Bell,
  Menu,
  MapPin,
  ChevronDown,
  ChevronRight,
  X,
  Package,
  FileText,
  History,
  Monitor,
  Hammer,
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

const SuperAdminDashboard = ({ user, logout }) => {
  const [openDivisi, setOpenDivisi] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  return (
    <div className="flex min-h-screen bg-[#f4f6fb] relative">

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`
          fixed z-40 top-0 left-0 h-full
          w-72 bg-gradient-to-b from-[#0f172a] to-black text-white
          flex flex-col justify-between p-6 overflow-y-auto
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >

        <div>

          {/* MOBILE HEADER */}
          <div className="flex items-center justify-between mb-8 lg:hidden">
            <div className="flex justify-center w-full">
              <img
                src="/images/LOGO HSR.png"
                alt="HSR Logo"
                className="h-10 object-contain"
              />
            </div>

            <X
              size={22}
              className="cursor-pointer absolute right-6"
              onClick={() => setSidebarOpen(false)}
            />
          </div>

          {/* DESKTOP LOGO */}
          <div className="hidden lg:flex justify-center mb-10">
            <img
              src="/images/LOGO HSR.png"
              alt="HSR Logo"
              className="h-14 object-contain"
            />
          </div>

          <div className="space-y-2">

            <div onClick={() => setCurrentPage("dashboard")}>
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text="Dashboard"
                active={currentPage === "dashboard"}
              />
            </div>

            {/* DIVISI */}
            <div
              className="flex items-center justify-between px-4 py-2 rounded-lg hover:bg-slate-800 cursor-pointer transition"
              onClick={() => setOpenDivisi(!openDivisi)}
            >
              <div className="flex items-center gap-3">
                <Folder size={18} />
                Divisi
              </div>

              {openDivisi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {openDivisi && (
              <div className="ml-6 space-y-1 text-sm">

                <SidebarItem icon={<Monitor size={16} />} text="IT" />

                <div onClick={() => setCurrentPage("service")}>
                  <SidebarItem
                    icon={<Wrench size={16} />}
                    text="Service"
                    active={currentPage === "service"}
                  />
                </div>

                <SidebarItem icon={<Hammer size={16} />} text="Kontraktor" />
                <SidebarItem icon={<BarChart3 size={16} />} text="Sales" />

              </div>
            )}

            <SidebarItem icon={<User size={18} />} text="Profile" />

          </div>
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-medium shadow-lg transition"
        >
          Logout
        </button>

      </aside>


      {/* ================= MAIN ================= */}
      <main className="flex-1 flex flex-col min-w-0 lg:ml-72">

        {/* HEADER */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-4">
            <Menu
              size={22}
              className="text-gray-600 cursor-pointer lg:hidden"
              onClick={() => setSidebarOpen(true)}
            />

            <h1 className="text-xl font-semibold">
              Dokumentasi Kerja
            </h1>

            <input
              type="text"
              placeholder="Cari menu..."
              className="hidden md:block ml-6 bg-gray-100 px-4 py-2 rounded-full w-72 outline-none"
            />
          </div>


          <div className="flex items-center gap-4">

            <Bell size={20} className="text-gray-600" />

            <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full">

              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                {user?.name?.charAt(0)}
              </div>

              <span className="font-medium hidden sm:block">
                {user?.name}
              </span>

            </div>

          </div>

        </header>


        {/* CONTENT */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">


          {/* ================= DASHBOARD ================= */}
          {currentPage === "dashboard" && (
            <>

              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Dashboard
              </h2>

              <p className="text-gray-500 mb-10">
                Selamat Datang di Sistem Dokumentasi Kerja
              </p>


              {/* DIVISI */}
              <div className="bg-white rounded-3xl shadow-md p-8 mb-12">

                <h3 className="text-xl font-semibold mb-6">
                  Divisi
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">

                  <Card
                    title="IT"
                    desc="Kelola dokumentasi IT"
                    image="/images/istockphoto-1321221451-612x61211.jpg"
                  />

                  <Card
                    title="SERVICE"
                    desc="Kelola dokumentasi Service"
                    image="/images/service.jpg"
                    setCurrentPage={setCurrentPage}
                  />

                  <Card
                    title="KONTRAKTOR"
                    desc="Kelola dokumentasi Kontraktor"
                    image="/images/kontraktor.jpg"
                  />

                  <Card
                    title="SALES"
                    desc="Kelola dokumentasi Sales"
                    image="/images/sales.jpg"
                  />

                </div>

              </div>


              {/* SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">

                <SummaryCard
                  title="Total Tugas"
                  value="235"
                  icon={<ListTodo />}
                  color="blue"
                />

                <SummaryCard
                  title="Tugas Selesai"
                  value="180"
                  icon={<CheckCircle />}
                  color="green"
                />

                <SummaryCard
                  title="Sedang Dikerjakan"
                  value="42"
                  icon={<Clock />}
                  color="yellow"
                />

                <SummaryCard
                  title="Tugas Terlambat"
                  value="13"
                  icon={<AlertTriangle />}
                  color="red"
                />

              </div>


              {/* TABLE */}
              <div className="bg-white rounded-3xl shadow-md p-8">

                <h3 className="text-xl font-semibold mb-6">
                  Aktivitas Pekerjaan
                </h3>

                <div className="overflow-x-auto">

                  <table className="w-full min-w-[750px] text-sm">

                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="py-3 text-left">Divisi</th>
                        <th className="py-3 text-left">Tugas</th>
                        <th className="py-3 text-left">Karyawan</th>
                        <th className="py-3 text-left">Lokasi</th>
                        <th className="py-3 text-left">Status</th>
                        <th className="py-3 text-left">Tanggal</th>
                      </tr>
                    </thead>

                    <tbody>

                      <ReportRow
                        divisi="IT"
                        tugas="Set Up Server"
                        karyawan="Sandi"
                        lokasi="Jakarta"
                        status="Selesai"
                        tanggal="24 April 2024"
                      />

                      <ReportRow
                        divisi="Service"
                        tugas="Service AC"
                        karyawan="Indra"
                        lokasi="Bandung"
                        status="Proses"
                        tanggal="23 April 2024"
                      />

                      <ReportRow
                        divisi="Kontraktor"
                        tugas="Panel Listrik"
                        karyawan="Budi"
                        lokasi="Tangerang"
                        status="Terlambat"
                        tanggal="22 April 2024"
                      />

                    </tbody>

                  </table>

                </div>

              </div>

            </>
          )}


          {/* ================= SERVICE ================= */}
          {currentPage === "service" && (
            <>

              <div className="flex items-center gap-4 mb-8">

                <button
                  onClick={() => setCurrentPage("dashboard")}
                  className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
                >
                  ← Kembali
                </button>

                <h2 className="text-3xl font-bold">
                  Service
                </h2>

              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <ServiceCard
                  icon={<Package size={28} />}
                  title="Inventory Barang"
                  desc="Kelola stok barang"
                />

                <ServiceCard
                  icon={<FileText size={28} />}
                  title="Dokumentasi"
                  desc="Upload laporan kerja"
                />

                <ServiceCard
                  icon={<History size={28} />}
                  title="Riwayat"
                  desc="Histori pekerjaan"
                />

              </div>

            </>
          )}

        </div>

      </main>

    </div>
  );
};


/* ================= COMPONENT ================= */

const SidebarItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition
    ${active ? "bg-blue-600" : "hover:bg-slate-800"}`}
  >
    {icon}
    {text}
  </div>
);


const Card = ({ title, desc, image, setCurrentPage }) => {

  const handleClick = () => {
    if (title === "SERVICE") {
      setCurrentPage("service");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
    >

      <img
        src={image}
        alt={title}
        className="w-full h-56 object-cover group-hover:scale-110 transition"
      />

      <div className="absolute inset-0 bg-black/50"></div>

      <div className="absolute bottom-0 p-6 text-white w-full">

        <h3 className="text-2xl font-bold">
          {title}
        </h3>

        <p className="text-sm mb-4">
          {desc}
        </p>

        <button className="bg-white/20 px-4 py-2 rounded-xl">
          Masuk →
        </button>

      </div>

    </div>
  );
};


const SummaryCard = ({ title, value, icon, color }) => {

  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">

      <div>
        <p className="text-gray-500 text-sm">
          {title}
        </p>

        <h2 className="text-3xl font-bold mt-2">
          {value}
        </h2>
      </div>

      <div
        className={`w-14 h-14 flex items-center justify-center rounded-xl ${colorMap[color]}`}
      >
        {icon}
      </div>

    </div>
  );
};


const ServiceCard = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">

    <div className="mb-4 text-blue-600">
      {icon}
    </div>

    <h3 className="text-xl font-semibold mb-2">
      {title}
    </h3>

    <p className="text-gray-500 text-sm">
      {desc}
    </p>

  </div>
);


const ReportRow = ({ divisi, tugas, karyawan, lokasi, status, tanggal }) => {

  const statusColor = {
    Selesai: "bg-green-100 text-green-600",
    Proses: "bg-yellow-100 text-yellow-600",
    Terlambat: "bg-red-100 text-red-600"
  };

  return (
    <tr className="border-b hover:bg-gray-50">

      <td className="py-4">{divisi}</td>
      <td className="py-4 font-medium">{tugas}</td>
      <td className="py-4">{karyawan}</td>

      <td className="py-4 flex items-center gap-2 text-gray-600">
        <MapPin size={16} />
        {lokasi}
      </td>

      <td className="py-4">
        <span className={`px-3 py-1 rounded-full text-xs ${statusColor[status]}`}>
          {status}
        </span>
      </td>

      <td className="py-4 text-gray-500">
        {tanggal}
      </td>

    </tr>
  );
};


export default SuperAdminDashboard;
