import React, { useState } from "react";
import {
  LayoutDashboard,
  Folder,
  User,
  Menu,
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
  MapPin,
  Server,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboard({ user, logout }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");

  const currentDivisi = user?.divisi || "Service";

  /* ================= HELPER ================= */

  const getDivisiPage = () => {
    if (currentDivisi === "IT") return "it";
    if (currentDivisi === "Service" || currentDivisi === "SERVICE") return "service";
    if (currentDivisi === "Kontraktor") return "kontraktor";
    if (currentDivisi === "Sales") return "sales";
    return "service";
  };

  const getDivisiImage = () => {
    if (currentDivisi === "IT") return "/images/it.jpg";
    if (currentDivisi === "Service" || currentDivisi === "SERVICE") return "/images/service.jpg";
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

  /* ================= LAYOUT ================= */

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

      {/* ============ SIDEBAR ============ */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-72 bg-gradient-to-b from-[#0f172a] to-black text-white flex flex-col justify-between p-6 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >

        <div>

          <div className="flex justify-center mb-10">
            <img
              src="/images/LOGO HSR.png"
              alt="HSR"
              className="h-14"
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
              <div onClick={() => setCurrentPage(getDivisiPage())}>
                <SidebarItem
                  icon={divisiIcons[currentDivisi]}
                  text={currentDivisi}
                  active={currentPage === getDivisiPage()}
                />
              </div>
            </div>

            <SidebarItem icon={<User size={18} />} text="Profile" />

          </div>
        </div>

        <button
          onClick={logout}
          className="bg-red-600 hover:bg-red-700 py-3 rounded-xl font-medium"
        >
          Logout
        </button>

      </aside>

      {/* ============ MAIN ============ */}
      <main className="flex-1 lg:ml-72 flex flex-col">

        {/* HEADER */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-4">

            <Menu
              size={22}
              className="cursor-pointer lg:hidden"
              onClick={() => setSidebarOpen(true)}
            />

            <h1 className="text-xl font-semibold">
              {currentPage === "dashboard"
                ? `Dashboard ${currentDivisi}`
                : currentDivisi}
            </h1>

          </div>

          <div className="flex items-center gap-3">

            <div className="bg-blue-600 text-white w-9 h-9 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0)}
            </div>

            <span>{user?.name}</span>

          </div>

        </header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-y-auto">

          {/* ================= DASHBOARD ================= */}
          {currentPage === "dashboard" && (
            <>
              <h2 className="text-3xl font-bold mb-2">
                Selamat Datang, {user?.name}
              </h2>

              <p className="text-gray-500 mb-10">
                Admin {currentDivisi}
              </p>

              {/* SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">

                <SummaryCard title="Total Tugas" value="120" icon={<ListTodo />} color="blue" />
                <SummaryCard title="Tugas Selesai" value="85" icon={<CheckCircle />} color="green" />
                <SummaryCard title="Proses" value="25" icon={<Clock />} color="yellow" />
                <SummaryCard title="Terlambat" value="10" icon={<AlertTriangle />} color="red" />

              </div>

              {/* CARD DIVISI */}
              <div className="bg-white rounded-3xl shadow p-8">

                <h3 className="text-xl font-semibold mb-6">
                  Divisi {currentDivisi}
                </h3>

                <div
                  onClick={() => setCurrentPage(getDivisiPage())}
                  className="relative rounded-3xl overflow-hidden shadow group cursor-pointer"
                >

                  <img
                    src={getDivisiImage()}
                    className="w-full h-56 object-cover group-hover:scale-110 transition"
                  />

                  <div className="absolute inset-0 bg-black/50" />

                  <div className="absolute bottom-0 p-6 text-white">

                    <h3 className="text-2xl font-bold">
                      {currentDivisi}
                    </h3>

                    <p className="text-sm mb-3">
                      Kelola {currentDivisi}
                    </p>

                    <button className="bg-white/20 px-4 py-2 rounded-xl">
                      Masuk →
                    </button>

                  </div>

                </div>

              </div>

            </>
          )}

          {/* ================= SERVICE ================= */}
          {currentPage === "service" && (
            <DivisiLayout
              title="Service"
              back={() => setCurrentPage("dashboard")}
            >
              <ServiceCard icon={<Package size={28} />} title="Inventory" desc="Kelola barang" />
              <ServiceCard icon={<FileText size={28} />} title="Dokumentasi" desc="Upload laporan" />
              <ServiceCard icon={<History size={28} />} title="Riwayat" desc="Histori kerja" />
            </DivisiLayout>
          )}

          {/* ================= IT ================= */}
          {currentPage === "it" && (
            <DivisiLayout
              title="IT Department"
              back={() => setCurrentPage("dashboard")}
            >
              <ServiceCard icon={<Server size={28} />} title="Server" desc="Kelola server" />
              <ServiceCard icon={<ShieldCheck size={28} />} title="Security" desc="Keamanan sistem" />
              <ServiceCard icon={<FileText size={28} />} title="IT Report" desc="Laporan IT" />
            </DivisiLayout>
          )}

          {/* ================= SALES ================= */}
          {currentPage === "sales" && (
            <DivisiLayout
              title="Sales"
              back={() => setCurrentPage("dashboard")}
            >
              <ServiceCard icon={<BarChart3 size={28} />} title="Target" desc="Target penjualan" />
              <ServiceCard icon={<History size={28} />} title="Transaksi" desc="Riwayat transaksi" />
              <ServiceCard icon={<FileText size={28} />} title="Report" desc="Laporan sales" />
            </DivisiLayout>
          )}

        </div>

      </main>

    </div>
  );
}

/* ================= COMPONENTS ================= */

const SidebarItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${
      active ? "bg-blue-600" : "hover:bg-slate-800"
    }`}
  >
    {icon}
    {text}
  </div>
);

const SummaryCard = ({ title, value, icon, color }) => {

  const map = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600"
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow flex justify-between">

      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h2 className="text-3xl font-bold mt-2">{value}</h2>
      </div>

      <div className={`w-14 h-14 flex items-center justify-center rounded-xl ${map[color]}`}>
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

const DivisiLayout = ({ title, back, children }) => (
  <>
    <button
      onClick={back}
      className="mb-6 bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
    >
      ← Kembali
    </button>

    <h2 className="text-3xl font-bold mb-10">
      {title}
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {children}
    </div>
  </>
);