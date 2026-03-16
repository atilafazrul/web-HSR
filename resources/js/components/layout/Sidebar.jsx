import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Folder,
  User,
  ChevronDown,
  ChevronRight,
  Monitor,
  Wrench,
  BarChart3,
  Hammer,
  LogOut,
  Users,
  X,
  Truck,
  ShoppingCart,
} from "lucide-react";

import { useLocation } from "react-router-dom";

export default function Sidebar({
  user,
  sidebarOpen,
  setSidebarOpen,
  logout,
  isExpanded = true,
  setIsExpanded,
  navigate,
  role = "admin",
}) {

  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [openDivisi, setOpenDivisi] = useState(() => {
    const saved = localStorage.getItem("sidebarDivisiOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarDivisiOpen", JSON.stringify(openDivisi));
  }, [openDivisi]);

  // Effect untuk mendeteksi resize window
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const expanded = isExpanded;
  const isMobile = windowWidth < 1024;

  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "admin";

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  const basePath =
    user?.role === "super_admin"
      ? "/super_admin"
      : "/admin";

  const allDivisis = [
    { name: "IT", path: "it", icon: <Monitor size={18} /> },
    { name: "Service", path: "service", icon: <Wrench size={18} /> },
    { name: "Kontraktor", path: "kontraktor", icon: <Hammer size={18} /> },
    { name: "Sales", path: "sales", icon: <BarChart3 size={18} /> },
    { name: "Logistik", path: "logistik", icon: <Truck size={18} /> },
    { name: "Purchasing", path: "purchasing", icon: <ShoppingCart size={18} /> },
  ];

  return (
    <>
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen && setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-50 top-0 left-0 h-full
        ${expanded ? "w-64 md:w-72" : "w-20"}
        text-white flex flex-col justify-between
        transform transition-all duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        overflow-y-auto overflow-x-hidden`}
        style={{ backgroundColor: "#172238" }}
      >

        <div className="flex-1 flex flex-col min-h-0">
          {/* MOBILE HEADER - CLOSE BUTTON */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-700">
            <span className="font-semibold text-lg">Menu</span>
            <button
              onClick={() => setSidebarOpen && setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* LOGO SECTION */}
          <div className="px-4 py-6 flex justify-center">
            <div className="relative">
              {/* Logo untuk expanded state */}
              <div className={`transition-all duration-300 ${expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'}`}>
                <img
                  src="/images/LOGO HSR.png"
                  alt="HSR"
                  className="h-10 md:h-12 object-contain"
                />
              </div>

              {/* Logo untuk collapsed state - hanya tampil di desktop */}
              {!expanded && !isMobile && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src="/images/LOGO HSR.png"
                    alt="HSR"
                    className="h-8 w-8 object-contain"
                  />
                </div>
              )}
            </div>
          </div>

          {/* NAVIGATION MENU */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {/* ================= DASHBOARD ================= */}
            <div onClick={() => {
              navigate(`${basePath}/dashboard`);
              if (isMobile) setSidebarOpen(false);
            }}>
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text="Dashboard"
                active={isActive(`${basePath}/dashboard`)}
                expanded={expanded}
                isMobile={isMobile}
              />
            </div>

            {/* ================= KARYAWAN (SUPER ADMIN ONLY) ================= */}
            {isSuperAdmin && (
              <div onClick={() => {
                navigate(`${basePath}/karyawan`);
                if (isMobile) setSidebarOpen(false);
              }}>
                <SidebarItem
                  icon={<Users size={18} />}
                  text="Karyawan"
                  active={isActive(`${basePath}/karyawan`)}
                  expanded={expanded}
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* ================= DIVISI (SUPER ADMIN) ================= */}
            {isSuperAdmin && (
              <div>
                <div
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                  onClick={() => setOpenDivisi(!openDivisi)}
                >
                  <div className="flex items-center min-w-0">
                    <Folder size={18} className="flex-shrink-0" />
                    <span className={`ml-3 truncate ${expanded ? "block" : "hidden"}`}>
                      Divisi
                    </span>
                  </div>

                  {expanded && (
                    <span className="flex-shrink-0">
                      {openDivisi ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </span>
                  )}
                </div>

                {/* ================= DIVISI LIST ================= */}
                {openDivisi && (
                  <div className="mt-1 space-y-1 pl-4">
                    {allDivisis.map((d) => (
                      <div
                        key={d.name}
                        onClick={() => {
                          navigate(`${basePath}/${d.path}`);
                          if (isMobile) setSidebarOpen(false);
                        }}
                      >
                        <SidebarItem
                          icon={d.icon}
                          text={d.name}
                          active={isActive(`${basePath}/${d.path}`)}
                          expanded={expanded}
                          indented
                          isMobile={isMobile}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= ADMIN: SINGLE DIVISI ================= */}
            {isAdmin && !isSuperAdmin && (
              <div onClick={() => {
                navigate(`${basePath}/${user?.divisi?.toLowerCase() || "service"}`);
                if (isMobile) setSidebarOpen(false);
              }}>
                <SidebarItem
                  icon={<Folder size={18} />}
                  text={user?.divisi || "Service"}
                  active={isActive(`${basePath}/${user?.divisi?.toLowerCase() || "service"}`)}
                  expanded={expanded}
                  indented
                  isMobile={isMobile}
                />
              </div>
            )}

            {/* ================= PROFILE ================= */}
            <div onClick={() => {
              navigate(`${basePath}/profile`);
              if (isMobile) setSidebarOpen(false);
            }}>
              <SidebarItem
                icon={<User size={18} />}
                text="Profile"
                active={isActive(`${basePath}/profile`)}
                expanded={expanded}
                isMobile={isMobile}
              />
            </div>
          </nav>
        </div>

        {/* ================= LOGOUT ================= */}
        <div className="px-3 py-4 border-t border-slate-700">
          <button
            onClick={() => {
              logout();
              if (isMobile) setSidebarOpen(false);
            }}
            className="w-full bg-red-500 hover:bg-red-600 py-2.5 rounded-xl font-medium shadow transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {expanded && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ================= SIDEBAR ITEM ================= */
const SidebarItem = ({
  icon,
  text,
  active,
  expanded,
  indented = false,
  isMobile = false
}) => {
  // Di mobile saat sidebar terbuka, selalu tampilkan teks
  const showText = expanded || isMobile;

  return (
    <div
      className={`flex items-center py-2.5 rounded-lg cursor-pointer transition-all
        ${active ? "bg-blue-500 hover:bg-blue-600" : "hover:bg-slate-800"}
        ${indented && showText ? "pl-8 pr-3" : "px-3"}
        ${!showText ? "justify-center" : ""}
        group`}
    >
      <span className={`flex-shrink-0 ${!showText ? 'mx-auto' : ''}`}>
        {icon}
      </span>

      {showText && (
        <span className="ml-3 truncate text-sm">
          {text}
        </span>
      )}

      {/* Tooltip untuk collapsed state di desktop */}
      {!showText && !isMobile && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {text}
        </div>
      )}
    </div>
  );
};