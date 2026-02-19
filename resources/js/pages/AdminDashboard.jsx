import React, { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  User,
  Menu,
  X,
  Monitor,
  Wrench,
  Hammer,
  BarChart3,
  Package,
  FileText,
  History,
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin
} from "lucide-react";

export default function AdminDashboard({ user, logout }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const currentDivisi = user?.divisi;

  const getDivisiImage = () => {
    if (currentDivisi === "IT") return "/images/istockphoto-1321221451-612x61211.jpg";
    if (currentDivisi === "Service") return "/images/istockphoto-1321221451-612x61213.jpg";
    if (currentDivisi === "SERVICE") return "/images/service.jpg";
    if (currentDivisi === "Kontraktor") return "/images/kontraktor.jpg";
    if (currentDivisi === "Sales") return "/images/sales.jpg";
    return "/images/service.jpg";
  };

  const divisiIcons = {
    IT: <Monitor size={18} />,
    Service: <Wrench size={18} />,
    SERVICE: <Wrench size={18} />,
    Kontraktor: <Hammer size={18} />,
    Sales: <BarChart3 size={18} />
  };

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-72 bg-gradient-to-b from-[#0f172a] to-black text-white flex flex-col justify-between p-6 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >

        <div>

          <div className="flex justify-center mb-10">
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

            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-800">
              <Folder size={18} />
              Divisi
            </div>

            <div className="ml-6 mt-2">
              <div onClick={() => setCurrentPage("service")}>
                <SidebarItem
                  icon={divisiIcons[currentDivisi]}
                  text={currentDivisi}
                  active={currentPage === "service"}
                />
              </div>
            </div>

            <SidebarItem icon={<User size={18} />} text="Profile" />

          </div>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-medium transition"
        >
          Logout
        </button>

      </aside>

      {/* ================= MAIN ================= */}
      <main className="flex-1 lg:ml-72 flex flex-col">

        {/* HEADER */}
        <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-4">
            <Menu
              size={22}
              className="text-gray-600 cursor-pointer lg:hidden"
              onClick={() => setSidebarOpen(true)}
            />

            <h1 className="text-xl font-semibold">
              {currentPage === "dashboard"
                ? `Dashboard ${currentDivisi}`
                : currentDivisi}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-blue-500 text-white w-9 h-9 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0)}
            </div>
            <span className="font-medium">{user?.name}</span>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">

          {/* ================= DASHBOARD ================= */}
          {currentPage === "dashboard" && (
            <>
              <h2 className="text-3xl font-bold mb-2">
                Selamat Datang, {user?.name}
              </h2>

              <p className="text-gray-500 mb-10">
                Anda login sebagai Admin {currentDivisi}
              </p>

              {/* SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">

                <SummaryCard title="Total Tugas" value="120" icon={<ListTodo />} color="blue" />
                <SummaryCard title="Tugas Selesai" value="85" icon={<CheckCircle />} color="green" />
                <SummaryCard title="Sedang Dikerjakan" value="25" icon={<Clock />} color="yellow" />
                <SummaryCard title="Tugas Terlambat" value="10" icon={<AlertTriangle />} color="red" />

              </div>

              {/* CARD DIVISI STYLE SUPERADMIN */}
              <div className="bg-white rounded-3xl shadow-md p-8">

                <h3 className="text-xl font-semibold mb-6">
                  Divisi {currentDivisi}
                </h3>

                <div
                  onClick={() => setCurrentPage("service")}
                  className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
                >

                  <img
                    src={getDivisiImage()}
                    alt={currentDivisi}
                    className="w-full h-56 object-cover group-hover:scale-110 transition duration-300"
                  />

                  <div className="absolute inset-0 bg-black/50"></div>

                  <div className="absolute bottom-0 p-6 text-white w-full">

                    <h3 className="text-2xl font-bold">
                      {currentDivisi}
                    </h3>

                    <p className="text-sm mb-4">
                      Kelola dokumentasi {currentDivisi}
                    </p>

                    <button className="bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition">
                      Masuk →
                    </button>

                  </div>

                </div>

              </div>

              {/* TABLE AKTIVITAS */}
              <div className="bg-white rounded-3xl shadow-md p-8 mt-12">

                <h3 className="text-xl font-semibold mb-6">
                  Aktivitas Pekerjaan
                </h3>

                <table className="w-full text-sm">

                  <thead>
                    <tr className="text-gray-500 border-b">
                      <th className="py-3 text-left">Tugas</th>
                      <th className="py-3 text-left">Karyawan</th>
                      <th className="py-3 text-left">Lokasi</th>
                      <th className="py-3 text-left">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    <ReportRow tugas="Service AC" karyawan="Indra" lokasi="Bandung" status="Proses" />
                    <ReportRow tugas="Maintenance Panel" karyawan="Budi" lokasi="Jakarta" status="Selesai" />
                  </tbody>

                </table>

              </div>

            </>
          )}

          {/* ================= SERVICE PAGE ================= */}
          {currentPage === "service" && (
            <>
              <button
                onClick={() => setCurrentPage("dashboard")}
                className="mb-6 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg"
              >
                ← Kembali
              </button>

              <h2 className="text-3xl font-bold mb-10">
                {currentDivisi}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <ServiceCard icon={<Package size={28} />} title="Inventory Barang" desc="Kelola stok barang" />
                <ServiceCard icon={<FileText size={28} />} title="Dokumentasi" desc="Upload laporan kerja" />
                <ServiceCard icon={<History size={28} />} title="Riwayat" desc="Histori pekerjaan" />

              </div>
            </>
          )}

        </div>

      </main>

    </div>
  );
}

/* COMPONENTS */

const SidebarItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition ${
      active ? "bg-blue-600" : "hover:bg-slate-800"
    }`}
  >
    {icon}
    {text}
  </div>
);

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
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold mt-2">{value}</h2>
      </div>
      <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
    </div>
  );
};

const ServiceCard = ({ icon, title, desc }) => (
  <div className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition">
    <div className="mb-4 text-blue-600">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-500 text-sm">{desc}</p>
  </div>
);

const ReportRow = ({ tugas, karyawan, lokasi, status }) => {

  const statusColor = {
    Selesai: "bg-green-100 text-green-600",
    Proses: "bg-yellow-100 text-yellow-600",
    Terlambat: "bg-red-100 text-red-600"
  };

  return (
    <tr className="border-b hover:bg-gray-50">
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
    </tr>
  );
};
