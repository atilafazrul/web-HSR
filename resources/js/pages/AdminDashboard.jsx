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
  ListTodo,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
} from "lucide-react";

/* IMPORT PAGE ASLI */
import ITPage from "./ITPage";
import ServicePage from "./ServicePage";
import SalesPage from "./SalesPage";
import KontraktorPage from "./KontraktorPage";
import Profile from "./Profile.jsx";

export default function AdminDashboard({ user, logout }) {

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [currentUser, setCurrentUser] = useState(user);

  const currentDivisi = user?.divisi || "Service";

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Get photo URL
  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `/storage/${photoPath}`;
  };

  const photoUrl = getPhotoUrl(currentUser?.profile_photo);
  const initialLetter = currentUser?.name?.charAt(0);

  // Normalize divisi to uppercase for icon lookup
  const divisiUpper = currentDivisi.toUpperCase();

  /* ================= PROFILE PAGE ================= */
  if (currentPage === "profile") {
    return (
      <Profile
        user={currentUser}
        logout={logout}
        onProfileUpdate={handleProfileUpdate}
        setCurrentPage={setCurrentPage}
      />
    );
  }

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

  const icons = {
    IT: <Monitor size={18} />,
    SERVICE: <Wrench size={18} />,
    KONTRAKTOR: <Hammer size={18} />,
    SALES: <BarChart3 size={18} />,
  };

  /* ================= LAYOUT ================= */

  return (
    <div className="flex min-h-screen bg-[#f4f6fb]">

      {/* SIDEBAR */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-72
        bg-gradient-to-b from-[#0f172a] to-black text-white
        p-6 flex flex-col justify-between
        transition-transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >

        <div>

          <div className="flex justify-center mb-10">
            <img src="/images/LOGO HSR.png" className="h-14" />
          </div>

          <div className="space-y-2">

            <div onClick={() => setCurrentPage("dashboard")}>
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text="Dashboard"
                active={currentPage === "dashboard"}
              />
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 rounded-lg">
              <Folder size={18} />
              Divisi
            </div>

            <div className="ml-6">

              <div onClick={() => setCurrentPage(getDivisiPage())}>
                <SidebarItem
                  icon={icons[divisiUpper] || <Wrench size={18} />}
                  text={currentDivisi}
                  active={currentPage === getDivisiPage()}
                />
              </div>

            </div>

            <div onClick={() => setCurrentPage("profile")}>
              <SidebarItem
                icon={<User size={18} />}
                text="Profile"
                active={currentPage === "profile"}
              />
            </div>

          </div>

        </div>

        <button
          onClick={logout}
          className="bg-red-600 py-3 rounded-xl font-medium"
        >
          Logout
        </button>

      </aside>

      {/* MAIN */}
      <main className="flex-1 lg:ml-72 flex flex-col">

        {/* HEADER */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <Menu
              size={22}
              className="lg:hidden cursor-pointer"
              onClick={() => setSidebarOpen(true)}
            />
            <h1 className="text-xl font-semibold">
              Dokumentasi Kerja
            </h1>
          </div>

          <div className="flex items-center gap-3">

            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="bg-blue-600 w-9 h-9 text-white rounded-full flex justify-center items-center">
                {initialLetter}
              </div>
            )}

            <span>{currentUser?.name}</span>

          </div>

        </header>

        {/* CONTENT */}
        <div className="flex-1 p-8 overflow-y-auto">

          {/* DASHBOARD */}
          {currentPage === "dashboard" && (
            <>
              <h2 className="text-3xl font-bold mb-2">
                Selamat Datang, {currentUser?.name}
              </h2>

              <p className="text-gray-500 mb-10">
                Selamat datang, {user?.name}
              </p>

              {/* CARD DIVISI (BALIK) */}
              <div className="bg-white rounded-3xl shadow p-8 mb-10">

                <h3 className="text-xl font-semibold mb-6">
                  Divisi
                </h3>

                <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">

                  <DivisiCard
                    title={currentDivisi}
                    image={getDivisiImage()}
                    onClick={() => setCurrentPage(getDivisiPage())}
                  />

                </div>

              </div>

              {/* SUMMARY */}
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

                <SummaryCard title="Total Tugas" value="120" icon={<ListTodo />} color="blue" />
                <SummaryCard title="Selesai" value="90" icon={<CheckCircle />} color="green" />
                <SummaryCard title="Proses" value="20" icon={<Clock />} color="yellow" />
                <SummaryCard title="Terlambat" value="10" icon={<AlertTriangle />} color="red" />

              </div>

              {/* TABLE */}
              <div className="bg-white rounded-3xl shadow p-8">

                <h3 className="text-xl font-semibold mb-6">
                  Aktivitas
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
                </table>

              </div>
            </>
          )}

          {/* PAGE ASLI */}
          {currentPage === "it" && <ITPage goBack={() => setCurrentPage("dashboard")} />}
          {currentPage === "service" && <ServicePage goBack={() => setCurrentPage("dashboard")} />}
          {currentPage === "sales" && <SalesPage goBack={() => setCurrentPage("dashboard")} />}
          {currentPage === "kontraktor" && <KontraktorPage goBack={() => setCurrentPage("dashboard")} />}

        </div>
      </main>
    </div>
  );
}

/* ================= COMPONENT ================= */

const SidebarItem = ({ icon, text, active }) => (
  <div
    className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer ${active ? "bg-blue-600" : "hover:bg-slate-800"
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

const Row = ({ divisi, tugas, nama, lokasi, status, tanggal = "2025" }) => {

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
        {tanggal}
      </td>

    </tr>
  );
};
