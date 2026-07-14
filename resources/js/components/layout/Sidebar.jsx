import React, { useEffect, useRef, useState } from "react";
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
  AlertTriangle,
  Wallet,
  Truck,
  ShoppingCart,
  FileText,
  CalendarCheck,
  ClipboardCheck,
  History as HistoryIcon,
} from "lucide-react";

import { useLocation } from "react-router-dom";
import { useI18n } from "../../i18n/index.jsx";

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
  const { t } = useI18n();

  const location = useLocation();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutConfirmRef = useRef(null);

  const [openDivisi, setOpenDivisi] = useState(() => {
    const saved = localStorage.getItem("sidebarDivisiOpen");
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    localStorage.setItem("sidebarDivisiOpen", JSON.stringify(openDivisi));
  }, [openDivisi]);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const onOutside = (e) => {
      if (logoutConfirmRef.current && !logoutConfirmRef.current.contains(e.target)) {
        setShowLogoutConfirm(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowLogoutConfirm(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showLogoutConfirm]);

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
  const isUser = role === "user";

  const isActive = (path) => {
    return (
      location.pathname === path ||
      location.pathname.startsWith(path + "/")
    );
  };

  const basePath =
    user?.role === "super_admin"
      ? "/super_admin"
      : user?.role === "user"
        ? "/user"
        : "/admin";

  const allDivisis = [
    { name: "IT", path: "it", icon: <Monitor size={18} /> },
    { name: "Service", path: "service", icon: <Wrench size={18} /> },
    { name: "Kontraktor", path: "kontraktor", icon: <Hammer size={18} /> },
    { name: "Sales", path: "sales", icon: <BarChart3 size={18} /> },
    { name: "Logistik", path: "logistik", icon: <Truck size={18} /> },
    { name: "Purchasing", path: "purchasing", icon: <ShoppingCart size={18} /> },
  ];

  const go = (path) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const currentDivisiPath = (user?.divisi || "service").toLowerCase();
  const isAnyDivisiActive = (divisiPath) => isActive(`${basePath}/${divisiPath}`);

  const fallbackDivisi = {
    name: user?.divisi || "Service",
    path: currentDivisiPath,
    icon: <Wrench size={18} />,
  };

  const divisiMenuItems = isSuperAdmin
    ? allDivisis
    : isAdmin || isUser
      ? [allDivisis.find((d) => d.path === currentDivisiPath) || fallbackDivisi]
      : [];

  const showDivisiMenu = divisiMenuItems.length > 0;
  const divisiSectionActive = divisiMenuItems.some((d) => isAnyDivisiActive(d.path));

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
        style={{ backgroundColor: "#0f172a" }}
      >

        <div className="flex-1 flex flex-col min-h-0">
          {/* MOBILE HEADER - CLOSE BUTTON */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
            <span className="font-semibold text-lg">{t("menu", "Menu")}</span>
            <button
              onClick={() => setSidebarOpen && setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-700 transition-colors"
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
            <button
              type="button"
              className="w-full text-left"
              onClick={() => go(`${basePath}/dashboard`)}
            >
              <SidebarItem
                icon={<LayoutDashboard size={18} />}
                text={t("dashboard", "Dashboard")}
                active={isActive(`${basePath}/dashboard`)}
                expanded={expanded}
                isMobile={isMobile}
              />
            </button>

            {/* ================= KARYAWAN (SUPER ADMIN ONLY) ================= */}
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => go(`${basePath}/karyawan`)}
                >
                  <SidebarItem
                    icon={<Users size={18} />}
                    text={t("employee", "Karyawan")}
                    active={isActive(`${basePath}/karyawan`)}
                    expanded={expanded}
                    isMobile={isMobile}
                  />
                </button>

                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => go(`${basePath}/rekap-akun`)}
                >
                  <SidebarItem
                    icon={<Wallet size={18} />}
                    text={t("expenseRecap", "Rekap Biaya Karyawan")}
                    active={isActive(`${basePath}/rekap-akun`)}
                    expanded={expanded}
                    isMobile={isMobile}
                  />
                </button>
              </>
            )}

            {/* ================= REKAP BIAYA AKUN (ADMIN) ================= */}
            {isAdmin && (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => go(`${basePath}/rekap-akun`)}
              >
                <SidebarItem
                  icon={<Wallet size={18} />}
                  text={t("expenseRecap", "Rekap Biaya Karyawan")}
                  active={isActive(`${basePath}/rekap-akun`)}
                  expanded={expanded}
                  isMobile={isMobile}
                />
              </button>
            )}

            {/* ================= APPROVAL CUTI (SUPER ADMIN) ================= */}
            {isSuperAdmin && (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => go(`${basePath}/cuti-approval`)}
              >
                <SidebarItem
                  icon={<ClipboardCheck size={18} />}
                  text={t("leaveApproval", "Approval Cuti")}
                  active={isActive(`${basePath}/cuti-approval`)}
                  expanded={expanded}
                  isMobile={isMobile}
                />
              </button>
            )}

            {/* ================= PENGAJUAN CUTI (ADMIN ONLY) ================= */}
            {isAdmin && (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => go(`${basePath}/cuti`)}
              >
                <SidebarItem
                  icon={<CalendarCheck size={18} />}
                  text={t("leaveRequest", "Pengajuan Cuti")}
                  active={isActive(`${basePath}/cuti`)}
                  expanded={expanded}
                  isMobile={isMobile}
                />
              </button>
            )}

            {/* ================= DIVISI (SUPER ADMIN / ADMIN / USER) ================= */}
            {showDivisiMenu && (
              <div>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setOpenDivisi(!openDivisi)}
                >
                  <SidebarItem
                    icon={<Folder size={18} />}
                    text={t("division", "Divisi")}
                    active={divisiSectionActive}
                    expanded={expanded}
                    isMobile={isMobile}
                    rightIcon={
                      expanded ? (
                        openDivisi ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                      ) : null
                    }
                  />
                </button>

                {openDivisi && (
                  <div className="mt-1 space-y-1">
                    {divisiMenuItems.map((d) => (
                      <button
                        type="button"
                        className="w-full text-left"
                        key={d.path}
                        onClick={() => go(`${basePath}/${d.path}`)}
                      >
                        <SidebarItem
                          icon={d.icon}
                          text={d.name}
                          active={isActive(`${basePath}/${d.path}`)}
                          expanded={expanded}
                          isMobile={isMobile}
                          indented
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ================= PROFILE ================= */}
            <button
              type="button"
              className="w-full text-left"
              onClick={() => go(`${basePath}/profile`)}
            >
              <SidebarItem
                icon={<User size={18} />}
                text={t("profile", "Profil")}
                active={isActive(`${basePath}/profile`)}
                expanded={expanded}
                isMobile={isMobile}
              />
            </button>

            {/* ================= LOG AKTIVITAS (SUPER ADMIN) ================= */}
            {isSuperAdmin && (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => go(`${basePath}/activity-log`)}
              >
                <SidebarItem
                  icon={<HistoryIcon size={18} />}
                  text={t("activityLog", "Log Aktivitas")}
                  active={isActive(`${basePath}/activity-log`)}
                  expanded={expanded}
                  isMobile={isMobile}
                />
              </button>
            )}
          </nav>
        </div>

        {/* ================= LOGOUT ================= */}
        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={() => {
              setShowLogoutConfirm(true);
            }}
            className="w-full bg-slate-700 hover:bg-slate-600 py-2.5 rounded-xl font-medium shadow transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={18} />
            {expanded && <span>{t("logout", "Logout")}</span>}
          </button>
        </div>
      </aside>

      {/* ================= LOGOUT CONFIRM MODAL ================= */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          onClick={() => !loggingOut && setShowLogoutConfirm(false)}
        >
          <div
            ref={logoutConfirmRef}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-400" />

            <div className="flex flex-col items-center px-6 pb-2 pt-7 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-100 shadow-inner ring-1 ring-indigo-100">
                <AlertTriangle size={30} className="text-indigo-600" strokeWidth={2} />
              </div>

              <h3 className="text-lg font-bold text-slate-800">
                {t("logoutConfirmTitle", "Confirm Logout")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {t("logoutConfirmDesc", "Are you sure you want to log out?")}
              </p>
            </div>

            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={loggingOut}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (loggingOut) return;
                  setLoggingOut(true);
                  try {
                    await Promise.resolve(logout?.());
                  } finally {
                    setLoggingOut(false);
                    setShowLogoutConfirm(false);
                    if (isMobile) setSidebarOpen(false);
                  }
                }}
                disabled={loggingOut}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:from-indigo-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loggingOut ? t("loggingOut", "Logging out...") : t("confirmLogout", "Yes, Logout")}
              </button>
            </div>
          </div>
        </div>
      )}
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
  isMobile = false,
  rightIcon = null,
}) => {
  // Di mobile saat sidebar terbuka, selalu tampilkan teks
  const showText = expanded || isMobile;

  return (
    <div
      className={`relative flex items-center py-2.5 rounded-lg transition-all select-none
        ${active ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "hover:bg-slate-700 text-slate-100"}
        ${indented && showText ? "pl-8 pr-3" : "px-3"}
        ${!showText ? "justify-center" : ""}
        group`}
    >
      <span className={`flex-shrink-0 ${!showText ? 'mx-auto' : ''}`}>
        {icon}
      </span>

      {showText && (
        <span className="ml-3 truncate text-sm flex-1">
          {text}
        </span>
      )}

      {showText && rightIcon ? (
        <span className="ml-2 flex-shrink-0 opacity-90">
          {rightIcon}
        </span>
      ) : null}

      {/* Tooltip untuk collapsed state di desktop */}
      {!showText && !isMobile && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
          {text}
        </div>
      )}
    </div>
  );
};